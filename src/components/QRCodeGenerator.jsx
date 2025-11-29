import { QRCodeSVG } from 'qrcode.react'
import './QRCodeGenerator.css'

/**
 * QR Code Generator Component
 * Uses qrcode.react library for QR code generation
 */
const QRCodeGenerator = ({ data, size = 200, level = 'M' }) => {
  if (!data) {
    return (
      <div className="qr-code-generator">
        <div className="qr-code-placeholder">
          <p>No data provided for QR code</p>
        </div>
      </div>
    )
  }

  try {
    return (
      <div className="qr-code-generator">
        <QRCodeSVG
          value={data}
          size={size}
          level={level}
          includeMargin={true}
          className="qr-code-svg"
        />
      </div>
    )
  } catch (error) {
    console.error('QR Code generation error:', error)
    return (
      <div className="qr-code-generator">
        <div className="qr-code-placeholder">
          <p>Error generating QR code</p>
        </div>
      </div>
    )
  }
}

export default QRCodeGenerator
