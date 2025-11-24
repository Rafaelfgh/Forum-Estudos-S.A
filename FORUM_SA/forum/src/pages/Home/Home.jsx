import styles from "./Home.module.css";
import { useNavigate } from "react-router-dom";

//components
import Footer from "../../components/Footer";


export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img src="imagem1.png" alt="Logo" className={styles.minhaImagem}/>
        <p className={styles.subtitle}>
          A comunidade definitiva para estudantes de concursos públicos. <br/>Compartilhe materiais, tire dúvidas, conecte-se com outros candidatos e conquiste sua aprovação!
        </p>
        <div className={styles.buttonGroup}>
          <button className={styles.btnPrimary} onClick={() => navigate("/forum")}>
            Ir para o Fórum
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate("/login")}>
            Fazer Login
          </button>
        </div>
      </header>

      <section className={styles.cardsSection}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Materiais de Estudo</h3>
          <p className={styles.cardText}>Acesse e compartilhe PDFs, resumos, mapas mentais e provas anteriores</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Perguntas & Respostas</h3>
          <p className={styles.cardText}>Tire dúvidas sobre questões e ajude outros candidatos</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Grupos de Estudo</h3>
          <p className={styles.cardText}>Forme grupos, conecte-se e estude junto com outros candidatos</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Acompanhe Concursos</h3>
          <p className={styles.cardText}>Fique por dentro de editais, prazos e novidades dos concursos</p>
        </div>
      </section>
     <Footer />
    </div>
  );
}