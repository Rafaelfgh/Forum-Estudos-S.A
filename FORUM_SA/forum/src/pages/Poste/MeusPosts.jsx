import { useEffect, useState, useRef } from "react";
import { supabase } from "../../backend/supabaseClient";
import styles from "./MeusPosts.module.css";

export default function MeusPosts() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editedPostContent, setEditedPostContent] = useState("");

  const [renamingPostId, setRenamingPostId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");

  const dropdownRefs = useRef({});

  // === Carregar usuário + posts ===
  useEffect(() => {
    async function fetchUserAndPosts() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
    }

    fetchUserAndPosts();
  }, []);

  // === Fechar dropdown ao clicar fora ===
  useEffect(() => {
    function handleClickOutside(e) {
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && !ref.contains(e.target)) {
          ref.style.display = "none";
        }
      });
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // === Editar conteúdo ===
  const handleEditPost = async (postId) => {
    await supabase
      .from("posts")
      .update({ content: editedPostContent })
      .eq("id", postId);

    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, content: editedPostContent } : p
      )
    );
    setEditingPostId(null);
  };

  const handleRenamePost = async (postId) => {
    await supabase
      .from("posts")
      .update({ title: editedTitle })
      .eq("id", postId);

    setPosts(
      posts.map((p) => (p.id === postId ? { ...p, title: editedTitle } : p))
    );
    setRenamingPostId(null);
  };

  // === Excluir ===
  const handleDeletePost = async (postId) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;

    await supabase.from("posts").delete().eq("id", postId);
    setPosts(posts.filter((p) => p.id !== postId));
  };

  if (!user) return <p>Carregando...</p>;

  return (
    <div className={styles.page}>
      
      <div className={styles.topbar}>
        
        <div className={styles.profileLink}>
            Meus Posts
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
          Voltar
        </button>
      </div>

      <div className={styles.container}>
        {posts.length === 0 && <p>Você ainda não criou nenhum post.</p>}

        {posts.map((post) => (
          <div key={post.id} className={styles.postCard}>

            {renamingPostId === post.id ? (
              <>
                <input
                  type="text"
                  className={styles.inputField}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
                <button
                  className={styles.saveBtn}
                  onClick={() => handleRenamePost(post.id)}
                >
                  Salvar
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setRenamingPostId(null)}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <h3 className={styles.postTitle}>{post.title}</h3>
            )}

            <p className={styles.postAuthor}>
              Publicado por: {user.user_metadata?.full_name || user.email}
            </p>

            {post.image_url && (
              <img src={post.image_url} alt="Post" className={styles.postImage} />
            )}

            {editingPostId === post.id ? (
              <>
                <textarea
                  className={styles.inputField}
                  value={editedPostContent}
                  onChange={(e) => setEditedPostContent(e.target.value)}
                />
                <button
                  className={styles.saveBtn}
                  onClick={() => handleEditPost(post.id)}
                >
                  Salvar
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setEditingPostId(null)}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <p className={styles.postContent}>{post.content}</p>
            )}

            <div className={styles.postActionsWrapper}>
              <button
                className={styles.postMenuBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  const el = dropdownRefs.current[post.id];
                  el.style.display =
                    el.style.display === "block" ? "none" : "block";
                }}
              >
                ⋮
              </button>

              <div
                ref={(el) => (dropdownRefs.current[post.id] = el)}
                className={styles.postMenuDropdown}
              >
                <button
                  className={styles.menuItem}
                  onClick={() => {
                    setEditingPostId(post.id);
                    setEditedPostContent(post.content);
                  }}
                >
                  Editar Conteúdo
                </button>

                <button
                  className={styles.menuItem}
                  onClick={() => {
                    setRenamingPostId(post.id);
                    setEditedTitle(post.title);
                  }}
                >
                  Renomear Título
                </button>

                <button
                  className={`${styles.menuItem} ${styles.deleteItem}`}
                  onClick={() => handleDeletePost(post.id)}
                >
                  Excluir
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
