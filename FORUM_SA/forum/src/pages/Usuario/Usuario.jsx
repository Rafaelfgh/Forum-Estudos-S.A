// src/pages/Usuario/Usuario.jsx
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../backend/supabaseClient";
import styles from "./Usuario.module.css";

export default function Usuario() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedPostContent, setEditedPostContent] = useState("");
  const dropdownRefs = useRef({});

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setName(user.user_metadata?.full_name || "");
        setEmail(user.email);
        setAvatarUrl(user.user_metadata?.avatar_url || "");
        fetchPosts(user.id);
      }
    }

    async function fetchPosts(userId) {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setPosts(data || []);
    }

    fetchUser();
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      Object.values(dropdownRefs.current).forEach(ref => {
        if (ref && !ref.contains(e.target)) {
          ref.style.display = "none";
        }
      });
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSave = async () => {
    let uploadedUrl = avatarUrl;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

      if (!error) uploadedUrl = data.path;
    }

    await supabase.auth.updateUser({
      email,
      password: password || undefined,
      data: { full_name: name, avatar_url: uploadedUrl },
    });
    alert("Perfil atualizado!");
    setAvatarFile(null);
  };

  const handleEditPost = async (postId) => {
    await supabase
      .from("posts")
      .update({ content: editedPostContent })
      .eq("id", postId);
    setPosts(posts.map(p => p.id === postId ? { ...p, content: editedPostContent } : p));
    setEditingPostId(null);
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(posts.filter(p => p.id !== postId));
  };

  if (!user) return <p>Carregando...</p>;

  return (
    <div className={styles.usuarioPage}>
      
      {/* Topbar */}
      <div className={styles.topbarContainer}>
        <div className={styles.topbarLeft}>
          <h2 className={styles.logoForum}>Meu Perfil</h2>
        </div>
        <button className={styles.backBtn} onClick={() => window.history.back()}>Voltar ao Fórum</button>
      </div>

      <div className={styles.usuarioContainer}>
        {/* Nome */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Mudar Nome de Perfil</h2>
          <input
            className={styles.inputField}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome"
          />
        </section>

        {/* Email */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Alterar Email</h2>
          <input
            className={styles.inputField}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
        </section>

        {/* Senha */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Alterar Senha</h2>
          <input
            className={styles.inputField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha"
            type="password"
          />
        </section>

        {/* Foto do perfil */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Adicionar Foto de Perfil</h2>
          <input
            type="file"
            className={styles.inputField}
            onChange={(e) => setAvatarFile(e.target.files[0])}
          />
          {(avatarFile || avatarUrl) && (
            <img
              src={avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl}
              alt="Avatar"
              className={styles.profileImage}
            />
          )}
        </section>

        {/* Botão salvar */}
        <button className={styles.saveBtn} onClick={handleSave}>
          Salvar Alterações
        </button>

        {/* Posts */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Seus Posts</h2>
          {posts.length === 0 && <p>Nenhum post ainda.</p>}
          {posts.map(post => (
            <div key={post.id} className={styles.postCard}>
              <h3 className={styles.postTitle}>{post.title}</h3>

              {/* Imagem do post */}
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="Post"
                  className={styles.postImage}
                />
              )}

              {editingPostId === post.id ? (
                <>
                  <textarea
                    className={styles.inputField}
                    value={editedPostContent}
                    onChange={(e) => setEditedPostContent(e.target.value)}
                  />
                  <button className={styles.saveBtn} onClick={() => handleEditPost(post.id)}>Salvar</button>
                  <button className={styles.backBtn} onClick={() => setEditingPostId(null)}>Cancelar</button>
                </>
              ) : (
                <p className={styles.postContent}>{post.content}</p>
              )}

              {/* Menu editar/excluir */}
              <div className={styles.postActionsWrapper}>
                <button
                  className={styles.postMenuBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    const el = dropdownRefs.current[post.id];
                    el.style.display = el.style.display === "block" ? "none" : "block";
                  }}
                >⋮</button>
                <div
                  ref={(el) => dropdownRefs.current[post.id] = el}
                  className={styles.postMenuDropdown}
                >
                  <button className={styles.menuItem} onClick={() => { setEditingPostId(post.id); setEditedPostContent(post.content); }}>Editar</button>
                  <button className={`${styles.menuItem} ${styles.deleteItem}`} onClick={() => handleDeletePost(post.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
