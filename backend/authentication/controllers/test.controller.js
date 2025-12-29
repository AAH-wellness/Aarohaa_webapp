import { sendResetCodeEmail } from '../utils/email.utils.js'

// Test email configuration
export const testEmail = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: {
          message: 'Email address is required',
          status: 400
        }
      })
    }

    // Generate a test code
    const testCode = '123456'
    
    console.log('\n🧪 Testing email configuration...')
    const result = await sendResetCodeEmail(email, testCode)

    if (result.success) {
      res.status(200).json({
        message: 'Test email sent successfully! Check your inbox.',
        status: 'success',
        messageId: result.messageId
      })
    } else {
      res.status(500).json({
        message: 'Email service not configured. Check backend console for details.',
        status: 'error',
        details: result.message
      })
    }
  } catch (error) {
    console.error('Test email error:', error)
    res.status(500).json({
      error: {
        message: 'Failed to send test email',
        details: error.message,
        status: 500
      }
    })
  }
}

