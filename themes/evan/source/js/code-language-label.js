/* Code block language label display.
 *
 * Adds language label to code blocks with language class.
 *
 * Browser usage:
 *   - Include /js/code-language-label.js (defer)
 *   - Automatically initializes on DOMContentLoaded
 */

function extractLanguage(block) {
  if (!block || !block.classList) return null;

  const classes = Array.from(block.classList);

  // Extract language from class name
  const languageClass = classes.find(cls =>
    cls.startsWith('language-') || cls.startsWith('lang-')
  );

  if (!languageClass) return null;

  const language = languageClass.replace(/^(language-|lang-)/, '');

  // Map common language codes to display names
  const languageMap = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'py': 'Python',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'c': 'C',
    'cpp': 'C++',
    'cs': 'C#',
    'java': 'Java',
    'kt': 'Kotlin',
    'swift': 'Swift',
    'php': 'PHP',
    'sh': 'Shell',
    'bash': 'Bash',
    'sql': 'SQL',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'md': 'Markdown',
  };

  const mappedLanguage = languageMap[language.toLowerCase()];
  if (mappedLanguage) {
    return mappedLanguage;
  }
  // Fallback to capitalize first letter if not in map
  return language.charAt(0).toUpperCase() + language.slice(1);
}

function addLanguageLabel(block, language, doc = document) {
  if (!doc) return;

  const header = doc.createElement('div');
  header.className = 'code-block-header';

  const label = doc.createElement('span');
  label.className = 'code-language-label';
  label.textContent = language;

  header.appendChild(label);

  // Insert before existing content
  block.insertBefore(header, block.firstChild);
}

function initCodeLanguageLabel({ document = globalThis.document } = {}) {
  if (!document) return;

  const codeBlocks = document.querySelectorAll('.article-content pre[class*="language-"], .article-content pre[class*="lang-"]');

  codeBlocks.forEach(block => {
    // Skip Mermaid blocks
    if (block.classList.contains('mermaid')) return;

    const language = extractLanguage(block);
    if (!language) return;

    addLanguageLabel(block, language, document);
  });
}

// Auto-init in browsers.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.CodeLanguageLabel = window.CodeLanguageLabel || {};
  window.CodeLanguageLabel.initCodeLanguageLabel = initCodeLanguageLabel;
  window.addEventListener('DOMContentLoaded', () => initCodeLanguageLabel());
}

// Exports for tests (CommonJS).
if (typeof module !== 'undefined') {
  module.exports = {
    extractLanguage,
    addLanguageLabel,
    initCodeLanguageLabel,
  };
}
