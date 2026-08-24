"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { 
  Plus, Loader2, RefreshCw, Trash2, ExternalLink, Download, Upload 
} from "lucide-react";

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [url, setUrl] = useState("");
  const [room, setRoom] = useState("Cozinha");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await fetch("/api/items");
    const data = await res.json();
    if (Array.isArray(data)) setItems(data);
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const scrapedData = await scrapeRes.json();
      if (scrapedData.error) throw new Error(scrapedData.error);
      
      const saveRes = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scrapedData, url, room }),
      });
      
      if (saveRes.ok) {
        setUrl("");
        fetchItems();
      }
    } catch (err: any) {
      alert("Erro ao adicionar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar este item?")) return;
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    fetchItems();
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    for (const item of items) {
      try {
        const scrapeRes = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url }),
        });
        const scrapedData = await scrapeRes.json();
        if (!scrapedData.error) {
          await fetch(`/api/items/${item.id}`, { method: "DELETE" });
          await fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...scrapedData, url: item.url, room: item.room }),
          });
        }
      } catch (e) {
        console.error("Failed to refresh", item.title);
      }
    }
    await fetchItems();
    setRefreshing(false);
  };

  const handleExport = () => {
    window.location.href = "/api/export";
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          alert("Importação concluída!");
          fetchItems();
        } else {
          alert("Erro na importação.");
        }
      } catch (err) {
        alert("Arquivo inválido.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const totalCash = items.reduce((acc, item) => acc + (item.cashPrice || 0), 0);
  const totalInstallment = items.reduce((acc, item) => acc + (item.installmentPrice || 0), 0);

  const rooms = ["Varanda", "Cozinha", "Sala", "Quarto", "Estudio", "Banheiro"];
  
  // Group items by room
  const itemsByRoom = items.reduce((acc, item) => {
    const r = item.room || "Geral";
    if (!acc[r]) acc[r] = [];
    acc[r].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  if (!isClient) {
    return <main className={styles.container}></main>;
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Coisas para a Casa</h1>
        <div className={styles.actions}>
          <button onClick={handleRefreshAll} disabled={refreshing} className="btn-icon" title="Atualizar Preços">
            <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button onClick={handleExport} className="btn-icon" title="Exportar Dados">
            <Download size={20} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-icon" title="Importar Dados">
            <Upload size={20} />
          </button>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className={styles.hiddenInput} 
          />
        </div>
      </header>

      <form onSubmit={handleAddUrl} className={`glass ${styles.formContainer}`}>
        <select 
          value={room} 
          onChange={(e) => setRoom(e.target.value)}
          className={`input-field ${styles.roomSelect}`}
        >
          {rooms.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input 
          type="url" 
          required
          placeholder="Cole o link do produto aqui..." 
          className="input-field" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Plus />}
          Adicionar
        </button>
      </form>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhum item salvo ainda. Cole um link acima para começar!</p>
        </div>
      ) : (
        <>
          <div className={`glass ${styles.totalsCard}`}>
            <h2>Resumo Total (Carrinho)</h2>
            <div className={styles.totalsContent}>
              <div className={styles.totalItem}>
                <span>Total à vista:</span>
                <strong>{formatPrice(totalCash)}</strong>
              </div>
              <div className={styles.totalItem}>
                <span>Total parcelado:</span>
                <strong>{formatPrice(totalInstallment)}</strong>
              </div>
            </div>
          </div>

          <div className={styles.roomSections}>
            {Object.entries(itemsByRoom).map(([r, roomItems]) => (
              <div key={r} className={styles.roomSection}>
                <h2 className={styles.roomTitle}>{r}</h2>
                <div className={styles.grid}>
                  {roomItems.map((item) => (
                    <div key={item.id} className={`glass ${styles.card}`}>
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.title} className={styles.cardImage} />
                      )}
                      <div className={styles.cardContent}>
                        <span className={styles.storeBadge}>{item.store}</span>
                        <h3 className={styles.cardTitle}>{item.title}</h3>
                        
                        <div className={styles.prices}>
                          <div className={styles.priceItem}>
                            <span>À vista</span>
                            <span className={styles.priceValue}>{formatPrice(item.cashPrice)}</span>
                          </div>
                          <div className={styles.priceItem}>
                            <span>Parcelado</span>
                            <span className={styles.priceValue}>{formatPrice(item.installmentPrice)}</span>
                          </div>
                        </div>

                        <div className={styles.cardActions}>
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
                            Ver na Loja <ExternalLink size={14} />
                          </a>
                          <button onClick={() => handleDelete(item.id)} className="btn-icon btn-danger">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
