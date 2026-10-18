const WAF_RULES = [
  {
    ruleId: "SQLI_001",
    attackType: "SQLi",
    pattern: /\b(union|select|insert|update|delete|drop|alter|exec|execute)\b|--/i,
    severity: 9,
    action: "block",
    enabled: true,
    description: "SQL Injection detection rule",
  },
  {
    ruleId: "XSS_001",
    attackType: "XSS",
    pattern: /(<script|javascript:|on\w+\s*=|<iframe|<embed|<object)/i,
    severity: 8,
    action: "block",
    enabled: true,
    description: "Cross-Site Scripting (XSS) detection rule",
  },
  {
    ruleId: "PATH_001",
    attackType: "Path Traversal",
    pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f)/i,
    severity: 8,
    action: "block",
    enabled: true,
    description: "Directory path traversal detection rule",
  },
  {
    ruleId: "CMDI_001",
    attackType: "Command Injection",
    pattern: /(\||;|`|\$\(|&&|\|\|)\s*(cat|ls|dir|rm|del|wget|curl|nc|bash|sh|cmd|powershell)/i,
    severity: 9,
    action: "block",
    enabled: true,
    description: "OS Command Injection detection rule",
  },
  {
    ruleId: "NOSQLI_001",
    attackType: "NoSQL Injection",
    pattern: /(\$gt|\$gte|\$lt|\$lte|\$ne|\$in|\$nin|\$regex|\$where|\$exists)/i,
    severity: 9,
    action: "block",
    enabled: true,
    description: "MongoDB NoSQL query operator injection",
  },
  {
    ruleId: "PROBE_001",
    attackType: "Suspicious Request",
    pattern: /(\.env|\.git|\.aws|\.ssh|wp-admin|wp-login|xmlrpc\.php|phpmyadmin|\/etc\/passwd|web\.config|server-status)/i,
    severity: 7,
    action: "block",
    enabled: true,
    description: "Sensitive system configuration or administrative probe",
  },
  {
    ruleId: "EXEC_001",
    attackType: "Suspicious Request",
    pattern: /(phpinfo\(|eval\(|base64_decode\(|passthru\(|popen\()/i,
    severity: 8,
    action: "block",
    enabled: true,
    description: "Suspicious arbitrary code execution payload",
  },
];

export const detectAttack = async (req) => {
  let urlToScan = "";
  try {
    urlToScan = decodeURIComponent(req.originalUrl || "");
  } catch (e) {
    urlToScan = req.originalUrl || "";
  }
  
  const bodyToScan = req.body ? JSON.stringify(req.body) : "";

  for (const rule of WAF_RULES) {
    if (!rule.enabled) continue;

    if (rule.pattern.test(urlToScan) || rule.pattern.test(bodyToScan)) {
      return {
        type: rule.attackType,
        severity: rule.severity,
        details: `Triggered rule ${rule.ruleId}: ${rule.description}`,
        ruleId: rule.ruleId,
      };
    }
  }

  return null;
};
