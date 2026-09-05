import { FileSensitivity } from '@prisma/client';

export interface ClassificationResult {
  sensitivity: FileSensitivity;
  confidence: number; // 0 to 100
  reasons: string[];
}

function extractReadableText(fileBuffer: Buffer, ext: string, mimeType: string): string {
  if (!fileBuffer || fileBuffer.length === 0) return '';
  const scanLength = Math.min(fileBuffer.length, 512 * 1024);
  const slice = fileBuffer.subarray(0, scanLength);

  // 1. Text-based files
  const textExtensions = [
    'txt', 'csv', 'json', 'xml', 'html', 'htm', 'yaml', 'yml',
    'js', 'ts', 'py', 'sh', 'bash', 'env', 'conf', 'ini', 'log', 'md'
  ];

  const isTextLike =
    mimeType.startsWith('text/') ||
    mimeType.includes('json') ||
    mimeType.includes('xml') ||
    mimeType.includes('yaml') ||
    mimeType.includes('csv') ||
    textExtensions.includes(ext);

  if (isTextLike) {
    try {
      return slice.toString('utf8');
    } catch {
      return '';
    }
  }

  // 2. PDF Text Extraction (Extract printable ASCII text streams and text tokens)
  if (ext === 'pdf' || mimeType.includes('pdf')) {
    try {
      const raw = slice.toString('latin1');
      const matches: string[] = [];
      const pdfTextMatches = raw.match(/\(([^()]{3,})\)/g);
      if (pdfTextMatches) {
        for (const m of pdfTextMatches) {
          matches.push(m.slice(1, -1));
        }
      }
      return matches.join(' ');
    } catch {
      return '';
    }
  }

  // 3. DOCX Text Extraction (Extract text inside <w:t> tags)
  if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
    try {
      const raw = slice.toString('latin1');
      const wtMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (wtMatches) {
        const textParts = wtMatches.map((m) => m.replace(/<[^>]+>/g, ''));
        return textParts.join(' ');
      }
    } catch {
      return '';
    }
  }

  return '';
}

export function classifyFileSensitivity(
  filename: string,
  mimeType: string,
  fileBuffer: Buffer,
  userProvidedSensitivity?: FileSensitivity
): ClassificationResult {
  const reasons: string[] = [];
  const lowerFilename = filename.toLowerCase();
  const ext = lowerFilename.includes('.') ? lowerFilename.split('.').pop() || '' : '';

  // Extract readable text payload before encryption
  const textContent = extractReadableText(fileBuffer, ext, mimeType);

  // =========================================================================
  // 1. CRITICAL SENSITIVITY (Requires High-Confidence Credential & Secret Signals)
  // =========================================================================
  const criticalExtensions = ['pem', 'key', 'p12', 'pfx', 'kdbx', 'asc', 'id_rsa', 'id_ed25519'];
  const criticalFilenameKeywords = ['private_key', 'root_key', 'master_key', 'credentials_backup', 'id_rsa'];

  const hasCriticalExt = criticalExtensions.includes(ext);
  const hasCriticalKw = criticalFilenameKeywords.some((kw) => lowerFilename.includes(kw));

  // High-Confidence Secret Signatures
  const privateKeyPattern = /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/i;
  const pgpPrivateKeyPattern = /-----BEGIN PGP PRIVATE KEY BLOCK-----/i;
  const awsAccessKeyPattern = /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/;
  const jwtPattern = /\beyJ[A-Za-z0-9-_]{10,}\.eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\b/;
  const githubTokenPattern = /\b(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})\b/;
  const dbConnStringPattern = /(?:postgres|postgresql|mongodb|mysql|redis):\/\/[^:\s]+:[^@\s]+@[^\s]+/i;

  // Credential Assignment Key Names required in prompt:
  // API_KEY, APIKEY, API_SECRET, SECRET_KEY, JWT_SECRET, JWT, ACCESS_TOKEN, AUTH_TOKEN, PASSWORD, DB_PASSWORD, DATABASE_PASSWORD, PRIVATE_KEY, CLIENT_SECRET
  const credentialKeyList = [
    'API_KEY', 'APIKEY', 'API_SECRET', 'SECRET_KEY', 'JWT_SECRET', 'JWT',
    'ACCESS_TOKEN', 'AUTH_TOKEN', 'PASSWORD', 'DB_PASSWORD', 'DATABASE_PASSWORD',
    'PRIVATE_KEY', 'CLIENT_SECRET', 'AWS_SECRET_ACCESS_KEY', 'AWS_ACCESS_KEY_ID',
    'MASTER_ENCRYPTION_KEY', 'ENCRYPTION_KEY', 'ROOT_PASSWORD', 'ADMIN_PASSWORD'
  ].join('|');

  // Matches KEY_NAME = VALUE or KEY_NAME: VALUE
  const credentialAssignmentRegex = new RegExp(
    `(?:^|\\s|["'\`({,;])(?:${credentialKeyList})\\s*[:=]\\s*["'\`]?([^"'\`\\s,;}{()\\[\\]]{4,})["'\`]?`,
    'i'
  );

  const hasPrivateKey = privateKeyPattern.test(textContent) || pgpPrivateKeyPattern.test(textContent);
  const hasAwsKey = awsAccessKeyPattern.test(textContent);
  const hasJwt = jwtPattern.test(textContent);
  const hasGithubToken = githubTokenPattern.test(textContent);
  const hasDbConnString = dbConnStringPattern.test(textContent);

  let hasRealSecretAssignment = false;
  if (textContent) {
    const match = credentialAssignmentRegex.exec(textContent);
    if (match && match[1]) {
      const val = match[1].trim().toLowerCase();
      const genericPlaceholders = ['123456', 'password', 'your_password', 'test', 'example', 'xxx', '<password>', 'placeholder', 'null', 'undefined', 'string'];
      if (!genericPlaceholders.includes(val) && !val.startsWith('<') && val.length >= 4) {
        hasRealSecretAssignment = true;
      }
    }
  }

  if (
    hasCriticalExt ||
    hasCriticalKw ||
    hasPrivateKey ||
    hasAwsKey ||
    hasJwt ||
    hasGithubToken ||
    hasDbConnString ||
    hasRealSecretAssignment
  ) {
    if (hasCriticalExt) reasons.push(`Key/Certificate file extension detected (.${ext})`);
    if (hasCriticalKw) reasons.push(`Filename indicates cryptographic key material`);
    if (hasPrivateKey) reasons.push(`Asymmetric private key cryptographic header detected`);
    if (hasAwsKey) reasons.push(`AWS Access Key signature detected`);
    if (hasJwt) reasons.push(`JSON Web Token (JWT) signature detected`);
    if (hasGithubToken) reasons.push(`GitHub Personal Access Token pattern detected`);
    if (hasDbConnString) reasons.push(`Database connection string containing credentials detected`);
    if (hasRealSecretAssignment) reasons.push(`Real secret credential key-value assignment detected`);

    return {
      sensitivity: FileSensitivity.CRITICAL,
      confidence: 98,
      reasons,
    };
  }

  // =========================================================================
  // 2. RESTRICTED SENSITIVITY (Requires PII, PCI-DSS, SSN, Tax/Medical Records)
  // =========================================================================
  const restrictedFilenameKeywords = ['payroll_record', 'ssn_export', 'tax_return_20', 'credit_card_list', 'patient_medical_record'];
  const hasRestrictedKw = restrictedFilenameKeywords.some((kw) => lowerFilename.includes(kw));

  const creditCardPattern = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/;
  const ssnPattern = /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/;
  const hasCreditCard = creditCardPattern.test(textContent);
  const hasSsn = ssnPattern.test(textContent);

  if (hasRestrictedKw || hasCreditCard || hasSsn) {
    if (hasRestrictedKw) reasons.push(`Filename indicates restricted PII/payroll record`);
    if (hasCreditCard) reasons.push(`Payment Card Industry (PCI-DSS) card number detected`);
    if (hasSsn) reasons.push(`Social Security Number (SSN) pattern detected`);

    return {
      sensitivity: FileSensitivity.RESTRICTED,
      confidence: 95,
      reasons,
    };
  }

  // =========================================================================
  // 3. CONFIDENTIAL SENSITIVITY (Requires Explicit Business Confidential Markers)
  // =========================================================================
  const confidentialFilenameKeywords = ['confidential_report', 'merger_terms', 'acquisition_agreement', 'board_minutes_signed', 'nda_signed'];
  const hasConfidentialKw = confidentialFilenameKeywords.some((kw) => lowerFilename.includes(kw));

  const confidentialTextKeywords = [
    'strictly confidential',
    'proprietary & confidential',
    'trade secret - do not distribute',
    'confidential - internal board use only',
  ];
  const hasConfidentialText = confidentialTextKeywords.some((kw) => textContent.toLowerCase().includes(kw));

  if (hasConfidentialKw || hasConfidentialText) {
    if (hasConfidentialKw) reasons.push(`Filename contains confidential business document marker`);
    if (hasConfidentialText) reasons.push(`Content contains proprietary confidential watermark header`);

    return {
      sensitivity: FileSensitivity.CONFIDENTIAL,
      confidence: 90,
      reasons,
    };
  }

  // =========================================================================
  // 4. PUBLIC SENSITIVITY
  // =========================================================================
  const publicFilenameKeywords = ['readme', 'license', 'terms_of_service', 'privacy_policy', 'public_notice'];
  const hasPublicKw = publicFilenameKeywords.some((kw) => lowerFilename.includes(kw));

  if (hasPublicKw || userProvidedSensitivity === FileSensitivity.PUBLIC) {
    reasons.push(`Publicly consumable file document`);
    return {
      sensitivity: FileSensitivity.PUBLIC,
      confidence: 95,
      reasons,
    };
  }

  // =========================================================================
  // 5. DEFAULT INTERNAL SENSITIVITY (Normal College Assignments, Reports, General Docs)
  // =========================================================================
  const finalSensitivity = userProvidedSensitivity || FileSensitivity.INTERNAL;
  reasons.push(`Standard document payload (${finalSensitivity})`);
  reasons.push(`No high-confidence credential or sensitive secret patterns detected`);

  return {
    sensitivity: finalSensitivity,
    confidence: 90,
    reasons,
  };
}

