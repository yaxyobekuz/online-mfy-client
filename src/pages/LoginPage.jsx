import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@heroui/react'

const LoginPage = () => {
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()
    navigate('/home')
  }

  return (
    <main className="login-page">
      <section className="login-content">
        <h1>Access key bilan kiring</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <Input
            className="login-input"
            name="accessKey"
            type="password"
            autoComplete="off"
            aria-label="Access key"
            placeholder="Access key"
            required
          />
          <Button className="login-submit" type="submit">Submit</Button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage