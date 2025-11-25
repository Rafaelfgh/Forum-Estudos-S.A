import { useEffect, useState, useRef } from "react";
import { supabase } from "../../backend/supabaseClient";
import styles from "./Usuario.module.css";

export default function Usuario() {
  const [user, setUser] = useState(null);

  // --- ESTADOS DO PERFIL ---
  const [name, setName] = useState("");
  const [loadingName, setLoadingName] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef(null);

  // --- ESTADOS DO ACORDEÃO ---
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  // --- ESTADOS DE SEGURANÇA ---
  const [newEmail, setNewEmail] = useState("");
  const [passwordForEmail, setPasswordForEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordForPassword, setPasswordForPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setName(user.user_metadata?.full_name || "");
        setNewEmail(user.email);
      }
    }
    fetchUser();
  }, []);

  // --- LÓGICA DE NOME ---
  const handleNameAction = async () => {
    if (!isEditingName) {
      setIsEditingName(true);
      setTimeout(() => nameInputRef.current?.focus(), 100);
      return;
    }
    setLoadingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });
    if (error) alert("Erro: " + error.message);
    else {
      alert("Nome atualizado!");
      setIsEditingName(false);
    }
    setLoadingName(false);
  };

  // --- LÓGICA DE EMAIL ---
  const handleUpdateEmail = async () => {
    if (!passwordForEmail) return alert("Digite sua senha atual.");
    setLoadingEmail(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForEmail,
    });
    if (loginError) {
      setLoadingEmail(false);
      return alert("Senha incorreta.");
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) alert("Erro: " + error.message);
    else {
      alert("Verifique seu novo email.");
      setPasswordForEmail("");
    }
    setLoadingEmail(false);
  };

  // --- LÓGICA DE SENHA ---
  const handleUpdatePassword = async () => {
    if (!passwordForPassword) return alert("Digite sua senha atual.");
    if (newPassword !== confirmNewPassword)
      return alert("Senhas não conferem.");
    setLoadingPassword(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForPassword,
    });
    if (loginError) {
      setLoadingPassword(false);
      return alert("Senha atual incorreta.");
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert("Erro: " + error.message);
    else {
      alert("Senha alterada!");
      setPasswordForPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
    setLoadingPassword(false);
  };

  // --- LÓGICA DE LOGOUT ---
  const handleLogout = async () => {
    const confirm = window.confirm("Tem certeza que deseja sair?");
    if (confirm) {
      await supabase.auth.signOut();
      window.location.href = "/"; 
    }
  };

  if (!user) return <p>Carregando...</p>;

  return (
    <div className={styles.usuarioPage}>
      
      {/* --- TOPBAR RESTAURADA --- */}
      <div className={styles.topbarContainer}>
        
        {/* Lado Esquerdo: Título */}
        <h2 className={styles.logoForum}>Meu Perfil</h2>

        {/* Centro: Imagem (Adicionada de volta) */}
        <img
            src="/imagem1.png"
            alt="Logo"
            className={styles.logoImage}
            onClick={() => (window.location.href = "/forum")}
        />

        {/* Lado Direito: Botão Voltar */}
        <button
          className={styles.backBtn}
          onClick={() => (window.location.href = "/forum")}
        >
          Voltar
        </button>
      </div>

      <div className={styles.usuarioContainer}>
        
        {/* --- CARD 1: PERFIL --- */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Dados Pessoais</h3>
          <section className={styles.section}>
            <label className={styles.label}>Nome de Exibição</label>
            <input
              ref={nameInputRef}
              className={`${styles.inputField} ${
                isEditingName ? styles.editable : styles.readOnly
              }`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              disabled={!isEditingName}
            />
          </section>
          
          <div className={styles.actionsRow}>
            <button
              className={styles.primaryBtn}
              onClick={handleNameAction}
              disabled={loadingName}
            >
              {loadingName ? "Salvando..." : isEditingName ? "Salvar" : "Alterar Nome"}
            </button>
            {isEditingName && (
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setIsEditingName(false);
                  setName(user.user_metadata?.full_name || "");
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* --- CARD 2: SEGURANÇA --- */}
        <div className={styles.card}>
          <div
            className={styles.accordionHeader}
            onClick={() => setIsSecurityOpen(!isSecurityOpen)}
          >
            <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>
              Segurança
            </h3>
            <span
              className={`${styles.arrow} ${
                isSecurityOpen ? styles.arrowUp : styles.arrowDown
              }`}
            >
              ▼
            </span>
          </div>

          {isSecurityOpen && (
            <div className={styles.accordionContent}>
              <p className={styles.helperText}>
                Gerencie seu email e senha. Alterações exigem sua senha atual.
              </p>
              <hr className={styles.divider} />

              <h4 className={styles.subTitle}>Alterar Email</h4>
              <div className={styles.formGrid}>
                <input
                  className={styles.inputField}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Novo E-mail"
                />
                <input
                  className={styles.inputField}
                  value={passwordForEmail}
                  onChange={(e) => setPasswordForEmail(e.target.value)}
                  placeholder="Senha atual"
                  type="password"
                />
              </div>
              <button
                className={styles.warningBtn}
                onClick={handleUpdateEmail}
                disabled={loadingEmail}
              >
                {loadingEmail ? "Verificando..." : "Atualizar Email"}
              </button>

              <hr className={styles.divider} />

              <h4 className={styles.subTitle}>Alterar Senha</h4>
              <div className={styles.formGrid}>
                <input
                  className={styles.inputField}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha"
                  type="password"
                />
                <input
                  className={styles.inputField}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  type="password"
                />
                <input
                  className={styles.inputField}
                  value={passwordForPassword}
                  onChange={(e) => setPasswordForPassword(e.target.value)}
                  placeholder="Senha atual"
                  type="password"
                />
              </div>
              <button
                className={styles.warningBtn}
                onClick={handleUpdatePassword}
                disabled={loadingPassword}
              >
                {loadingPassword ? "Verificando..." : "Atualizar Senha"}
              </button>
            </div>
          )}
        </div>

        {/* --- CARD 3: LOGOUT --- */}
        <div className={styles.card}>
            <h3 className={styles.cardTitle} >Sair da Conta</h3>
            <p className={styles.helperText}>Deseja encerrar sua sessão neste dispositivo?</p>
            <button className={styles.logoutBtn} onClick={handleLogout}>
                Sair
            </button>
        </div>

      </div>
    </div>
  );
}