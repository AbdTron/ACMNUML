import { useState, useRef, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { FiCamera, FiX } from 'react-icons/fi'
import './QRCodeScanner.css'

/**
 * QR Code Scanner Component
 * Uses html5-qrcode library for QR code scanning
 */
const QRCodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)
  const scannerInstanceRef = useRef(null)

  useEffect(() => {
    return () => {
      // Cleanup: stop scanner
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(err => {
          console.error('Error stopping scanner:', err)
        })
        scannerInstanceRef.current.clear()
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      if (!scannerRef.current) {
        setError('Scanner element not found')
        return
      }

      const html5QrCode = new Html5Qrcode(scannerRef.current.id)
      scannerInstanceRef.current = html5QrCode

      // Start scanning
      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // Scanning area
          aspectRatio: 1.0
        },
        (decodedText, decodedResult) => {
          // Success callback
          handleScanSuccess(decodedText)
        },
        (errorMessage) => {
          // Error callback - ignore most errors as they're just "no QR code found"
          // Only show actual errors
          if (errorMessage && !errorMessage.includes('No QR code found')) {
            console.log('QR scan error:', errorMessage)
          }
        }
      )

      setScanning(true)
      setError(null)
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError(err.message || 'Unable to start camera. Please check permissions.')
      setScanning(false)
    }
  }

  const stopScanning = async () => {
    try {
      if (scannerInstanceRef.current) {
        await scannerInstanceRef.current.stop()
        scannerInstanceRef.current.clear()
        scannerInstanceRef.current = null
      }
      setScanning(false)
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  const handleScanSuccess = (decodedText) => {
    // Stop scanning after successful scan
    stopScanning()
    // Call the onScan callback
    if (onScan) {
      onScan(decodedText)
    }
  }

  const handleManualInput = (e) => {
    e.preventDefault()
    const input = e.target.qrInput.value.trim()
    if (input) {
      handleScanSuccess(input)
      e.target.qrInput.value = ''
    }
  }

  return (
    <div className="qr-scanner-modal">
      <div className="qr-scanner-content">
        <div className="qr-scanner-header">
          <h3>Scan QR Code</h3>
          <button onClick={() => {
            stopScanning()
            onClose()
          }} className="close-btn">
            <FiX />
          </button>
        </div>

        <div className="qr-scanner-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="camera-preview">
            <div id="qr-reader" ref={scannerRef} style={{ width: '100%' }}></div>
            {!scanning && (
              <div className="camera-placeholder">
                <FiCamera />
                <p>Click "Start Camera" to begin scanning</p>
              </div>
            )}
          </div>

          <div className="scanner-controls">
            {!scanning ? (
              <button onClick={startScanning} className="btn btn-primary">
                <FiCamera />
                Start Camera
              </button>
            ) : (
              <button onClick={stopScanning} className="btn btn-secondary">
                Stop Camera
              </button>
            )}
          </div>

          <div className="manual-input-section">
            <p>Or enter QR code manually:</p>
            <form onSubmit={handleManualInput} className="manual-input-form">
              <input
                type="text"
                name="qrInput"
                placeholder="Paste QR code data here..."
                className="manual-input"
              />
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRCodeScanner
