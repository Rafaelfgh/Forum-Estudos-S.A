import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from "./Register.module.css";
import { supabase } from '../../backend/supabaseClient';
import { VscChromeClose } from "react-icons/vsc";

const Cadastro = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    
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

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          // 'data' é usado para salvar informações adicionais do usuário (metadados)
          data: {
            full_name: name, // Salva o nome do usuário no perfil de autenticação
          },
        },
      });

      if (error) {
        throw error; // Envia o erro para o bloco catch
      }

      alert('Cadastro realizado! Por favor, verifique sua caixa de entrada para confirmar seu e-mail.');
      navigate('/login'); // Redireciona para a página de login
    
    } catch (error) {
      setError(error.message); // Exibe o erro retornado pelo Supabase
    } finally {
      setLoading(false); // Garante que o estado de loading termine
    }
  };

  return (
    <div className={styles.cadastroContainer}>
    <div className={styles.imageContainer}>
      <img src="/imagem1.png" className={styles.cadastroImage} alt="Imagem de login" />
    </div>
      <form onSubmit={handleSubmit} className={styles.cadastroFormContainer}>
        <button className={styles.backButton} onClick={() => navigate("/")}><VscChromeClose /></button>
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

        {/* Alterado: Botão agora mostra o estado de carregamento */}
        <button type="submit" className={styles.cadastroButton} disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
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