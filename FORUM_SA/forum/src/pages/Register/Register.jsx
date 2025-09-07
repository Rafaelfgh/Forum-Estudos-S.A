import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from "./Register.module.css";

const Cadastro = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    
    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
    }

   
    console.log('Usuário cadastrado com sucesso:', { name, email });

    
    navigate('/login');
  };

  return (
    <div className={styles.cadastroContainer}>
      <form onSubmit={handleSubmit} className={styles.cadastroFormContainer}>
        <h1 className={styles.cadastroTitle}>Criar Conta</h1>

        <div className={styles.inputGroup}>
          <label htmlFor="name" className={styles.cadastroLabel}>Nome</label>
          <input
            id="name"
            type="text"
            placeholder="Digite seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.cadastroInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.cadastroLabel}>Email</label>
          <input
            id="email"
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.cadastroInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.cadastroLabel}>Senha</label>
          <input
            id="password"
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.cadastroInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword" className={styles.cadastroLabel}>Confirmar Senha</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder=""
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.cadastroInput}
          />
        </div>

        <button type="submit" className={styles.cadastroButton}>
          Cadastrar
        </button>

        {error && <p className={styles.cadastroError}>{error}</p>}

        <p className={styles.navigationLink}>
          Já tem uma conta? <Link to="/login">Faça login</Link>
        </p>

      </form>
    </div>
  );
};

export default Cadastro;