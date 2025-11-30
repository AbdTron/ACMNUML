import { useState } from 'react'
import { FiCopy, FiCheck } from 'react-icons/fi'
import './CodeSnippet.css'

const CodeSnippet = ({ code, language = 'javascript', title = '' }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Simple syntax highlighting for common keywords
  const highlightCode = (codeText, lang) => {
    if (!codeText) return ''

    // Keywords for different languages
    const keywords = {
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'async', 'await', 'try', 'catch'],
      python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'with', 'as', 'in', 'not', 'and', 'or'],
      java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'new', 'static', 'void'],
      cpp: ['include', 'using', 'namespace', 'class', 'public', 'private', 'protected', 'return', 'if', 'else', 'for', 'while', 'int', 'float', 'double', 'void'],
      html: ['<!DOCTYPE', 'html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'script', 'style', 'link', 'meta'],
      css: ['color', 'background', 'margin', 'padding', 'border', 'width', 'height', 'display', 'flex', 'grid']
    }

    const langKeywords = keywords[lang] || keywords.javascript

    let highlighted = codeText
    // Escape HTML
    highlighted = highlighted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Highlight strings
    highlighted = highlighted.replace(/(['"`])(.*?)\1/g, '<span class="string">$1$2$1</span>')

    // Highlight comments
    highlighted = highlighted.replace(/\/\/(.*?)$/gm, '<span class="comment">//$1</span>')
    highlighted = highlighted.replace(/\/\*(.*?)\*\//gs, '<span class="comment">/*$1*/</span>')
    highlighted = highlighted.replace(/#(.*?)$/gm, '<span class="comment">#$1</span>')

    // Highlight numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>')

    // Highlight keywords
    langKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g')
      highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`)
    })

    return highlighted
  }

  return (
    <div className="code-snippet">
      {title && (
        <div className="code-snippet-header">
          <span className="code-language">{language}</span>
          <span className="code-title">{title}</span>
        </div>
      )}
      <div className="code-snippet-wrapper">
        <pre className="code-pre">
          <code 
            className={`code-block language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
          />
        </pre>
        <button 
          className="copy-code-btn"
          onClick={handleCopy}
          aria-label="Copy code"
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? <FiCheck /> : <FiCopy />}
        </button>
      </div>
    </div>
  )
}

export default CodeSnippet








