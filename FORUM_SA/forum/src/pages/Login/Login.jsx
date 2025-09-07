import { useState } from 'react';
import styles from "./Login.module.css";
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (email === 'user@example.com' && password === '123456') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/');
    } else {
      setError('Email ou senha inválidos.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginFormContainer}>
        <h1 className={styles.loginTitle}>Acessar Conta</h1>

        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.loginLabel}>Email</label>
          <input
            id="email"
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.loginInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.loginLabel}>Senha</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.loginInput}
          />
        </div>

        <button type="submit" className={styles.loginButton}>
          Entrar
        </button>

        {error && <p className={styles.loginError}>{error}</p>}
        <p className={styles.navigationLink}>
          Não tem uma conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;