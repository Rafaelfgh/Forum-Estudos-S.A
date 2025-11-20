import { useEffect, useState } from "react";
import { supabase } from "../../backend/supabaseClient";
import styles from "./Usuario.module.css";

export default function Usuario() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        setName(user.user_metadata?.full_name || "");
        setEmail(user.email);
      }
    }

    fetchUser();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    let updateData = {};

    updateData.data = { full_name: name };

    updateData.email = email;

    if (newPassword || confirmNewPassword || currentPassword) {
      if (!currentPassword) {
        alert("Digite sua senha atual para confirmar a alteração.");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        alert("As senhas não coincidem!");
        return;
      }

      if (newPassword.length < 6) {
        alert("A nova senha deve ter pelo menos 6 caracteres.");
        return;
      }

      updateData.password = newPassword;
    }

    const { error } = await supabase.auth.updateUser(updateData);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      alert("Alterações salvas com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
  };

  if (!user) return <p>Carregando...</p>;

  return (
    <div className={styles.usuarioPage}>
      <div className={styles.topbarContainer}>
        <div className={styles.topbarLeft}>
          <h2 className={styles.logoForum}>Meu Perfil</h2>
        </div>

        <div className={styles.topbarCenter}>
          <img
            src="/imagem1.png"
            alt="Logo"
            className={styles.logoImage}
            onClick={() => (window.location.href = "/forum")}
          />
        </div>

        <button className={styles.backBtn} onClick={() => window.location.href = "/forum"}>
          Voltar ao Fórum
        </button>
      </div>

      <div className={styles.usuarioContainer}>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Nome de Perfil</h2>
          <input
            className={styles.inputField}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Alterar Email</h2>
          <input
            className={styles.inputField}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Novo email"
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Alterar Senha</h2>

          <input
            className={styles.inputField}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
            type="password"
          />

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
            placeholder="Confirmar nova senha"
            type="password"
          />
        </section>

        <button className={styles.saveBtn} onClick={handleSave}>
          Salvar Alterações
        </button>

      </div>
    </div>
  );
}
