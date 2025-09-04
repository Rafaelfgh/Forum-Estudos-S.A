import styles from "./Footer.module.css";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className={styles.footer}>
      <h2 className={styles.footerTitle}>Pronto para Começar?</h2>
      <p className={styles.footerDesc}>
        Junte-se a milhares de candidatos que já fazem parte da nossa comunidade
      </p>
      <button className={styles.footerBtn} onClick={() => navigate("/register")}>
        Cadastre-se
      </button>
    </footer>
  );
}