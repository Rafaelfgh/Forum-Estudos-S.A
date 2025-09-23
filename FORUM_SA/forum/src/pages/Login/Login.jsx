import { useState } from 'react';
import styles from "./Login.module.css";
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from "../../backend/supabaseClient"; 
import { VscChromeClose } from "react-icons/vsc";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

   const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        throw error;
      }
      navigate("/forum");
    } catch (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("E-mail ou senha inválidos.");
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
    <div className={styles.imageContainer}>
      <img src="/imagem1.png" className={styles.loginImage} alt="Imagem de login" />
    </div>
      <div className={styles.loginFormContainer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/")}
          aria-label="Voltar" 
        >
          <VscChromeClose />
        </button>
        <h1 className={styles.loginTitle}>Login</h1>
        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label className={styles.loginLabel}>E-mail:</label>
            <input
              className={styles.loginInput}
              type="email"
              name="email"
              required
              placeholder="E-mail do usuário"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.loginLabel}>Senha:</label>
            <input
              className={styles.loginInput}
              type="password"
              name="password"
              required
              placeholder="Insira sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className={styles.loginButton} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {error && <p className={styles.loginError}>{error}</p>}
        </form>
        <div className={styles.navigationLink}>
          <span>Não tem conta? </span>
          <Link to="/register">Clique aqui</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;