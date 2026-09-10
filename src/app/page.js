"use client";

import { useEffect, useMemo, useState } from "react";

function formatDate(date) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function filenameToTitle(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 100);
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [interval, setInterval] = useState(20);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("24");
  const [madeForKids, setMadeForKids] = useState(false);

  const [connected, setConnected] = useState(false);
    const [tiktokConnected, setTiktokConnected] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaInfo, setMetaInfo] = useState(null);
  const [channel, setChannel] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");

    setDate(`${yyyy}-${mm}-${dd}`);

    checkYouTube();
        checkTikTok();  
    checkMeta();    
  }, []);

  async function checkYouTube() {
    try {
      const response = await fetch(
        "/api/youtube/status"
      );

      const data = await response.json();

      setConnected(!!data.connected);
      setChannel(data.channel || null);
    } catch {}
  }

  function handleFiles(event) {
    const selected = Array.from(
      event.target.files || []
    ).filter((file) =>
      file.type.startsWith("video/")
    );

    setFiles(selected);
    setResults([]);
    setError("");
  }

  function removeFile(index) {
    setFiles((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function moveFile(index, direction) {
    setFiles((current) => {
      const copy = [...current];
      const target = index + direction;

      if (
        target < 0 ||
        target >= copy.length
      ) {
        return current;
      }

      [copy[index], copy[target]] = [
        copy[target],
        copy[index],
      ];

      return copy;
    });
  }

  const schedule = useMemo(() => {
    if (!date || !time) return [];

    const start = new Date(
      `${date}T${time}`
    );

    return files.map((file, index) => ({
      file,
      index,
      date: new Date(
        start.getTime() +
          index * Number(interval) * 60 * 1000
      ),
    }));
  }, [files, date, time, interval]);

  async function connectYouTube() {
    window.location.href =
      "/api/youtube/auth";
  }

  async function uploadAll() {
    if (!files.length) {
      setError("Selecciona tus Shorts primero.");
      return;
    }

    if (!connected) {
      setError(
        "Primero conecta tu canal de YouTube."
      );
      return;
    }

    const firstDate = schedule[0]?.date;

    if (
      !firstDate ||
      firstDate.getTime() <= Date.now()
    ) {
      setError(
        "La primera publicación debe estar en el futuro."
      );
      return;
    }

    setUploading(true);
    setCurrent(0);
    setResults([]);
    setError("");

    const newResults = [];

    for (let i = 0; i < schedule.length; i++) {
      const item = schedule[i];

      setCurrent(i + 1);

      const formData = new FormData();

      formData.append("file", item.file);
      formData.append(
        "title",
        filenameToTitle(item.file.name)
      );
      formData.append(
        "description",
        description
      );
      formData.append(
        "publishAt",
        item.date.toISOString()
      );
      formData.append(
        "categoryId",
        categoryId
      );
      formData.append(
        "madeForKids",
        String(madeForKids)
      );

      try {
        const response = await fetch(
          "/api/youtube/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Error desconocido"
          );
        }

        newResults.push({
          file: item.file.name,
          success: true,
          videoId: data.videoId,
          publishAt: item.date,
        });
      } catch (err) {
        newResults.push({
          file: item.file.name,
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Error",
          publishAt: item.date,
        });
      }

      setResults([...newResults]);
    }

    setUploading(false);
  }

  return (
    <main className="prime-app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">P</div>

          <div>
            <strong>PrimeScheduler</strong>
            <span>
              YouTube Shorts Scheduler
            </span>
          </div>
        </div>

<div className="connection" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {connected ? (
            <div className="connected">
              <span className="dot" />
              YouTube: {channel?.title || "conectado"}
            </div>
          ) : (
            <button className="google-button" onClick={connectYouTube}>
              Conectar YouTube
            </button>
          )}

          {tiktokConnected ? (
            <div className="connected">
              <span className="dot" />
              TikTok conectado
            </div>
          ) : (
            <button className="google-button" onClick={connectTikTok}>
              Conectar TikTok
            </button>
          )}

          {metaConnected ? (
            <div className="connected">
              <span className="dot" />
              {metaInfo?.pageName || "Meta conectado"}
              {metaInfo?.hasInstagram ? " (IG + FB)" : " (solo FB)"}
            </div>
          ) : (
            <button className="google-button" onClick={connectMeta}>
              Conectar Instagram / Facebook
            </button>
          )}
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">
            PRIMECLIPSNXT
          </div>

          <h1>
            Programa tus Shorts
            <br />
            <span>en masa.</span>
          </h1>

          <p>
            Selecciona tus 30–50 Shorts,
            elige la hora inicial y deja que
            PrimeScheduler haga el resto.
          </p>
        </div>

        <div className="hero-stat">
          <strong>{files.length}</strong>
          <span>SHORTS</span>
        </div>
      </section>

      <div className="workspace">
        <section className="panel">
          <div className="panel-title">
            <span>01</span>
            <div>
              <h2>Selecciona tus Shorts</h2>
              <p>
                Puedes seleccionar todos los
                MP4 de una sola vez.
              </p>
            </div>
          </div>

          <label className="dropzone">
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/*"
              multiple
              onChange={handleFiles}
            />

            <div className="upload-icon">
              ?
            </div>

            <strong>
              Seleccionar Shorts
            </strong>

            <span>
              MP4 / MOV · Selección múltiple
            </span>
          </label>

          {files.length > 0 && (
            <div className="file-list">
              <div className="file-list-header">
                <strong>
                  {files.length} videos
                </strong>

                <span>
                  Arrastra mentalmente el orden
                  usando las flechas
                </span>
              </div>

              {files.map((file, index) => (
                <div
                  className="file-row"
                  key={`${file.name}-${index}`}
                >
                  <div className="file-number">
                    {index + 1}
                  </div>

                  <div className="file-info">
                    <strong>
                      {file.name}
                    </strong>
                    <span>
                      {(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(1)}{" "}
                      MB
                    </span>
                  </div>

                  <div className="file-actions">
                    <button
                      onClick={() =>
                        moveFile(index, -1)
                      }
                      disabled={
                        index === 0
                      }
                    >
                      ?
                    </button>

                    <button
                      onClick={() =>
                        moveFile(index, 1)
                      }
                      disabled={
                        index ===
                        files.length - 1
                      }
                    >
                      ?
                    </button>

                    <button
                      onClick={() =>
                        removeFile(index)
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <span>02</span>
            <div>
              <h2>Configuración</h2>
              <p>
                Define cuándo quieres que
                aparezcan.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span>Fecha</span>
              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
              />
            </label>

            <label>
              <span>Primera publicación</span>
              <input
                type="time"
                value={time}
                onChange={(e) =>
                  setTime(e.target.value)
                }
              />
            </label>
          </div>

          <label className="full-field">
            <span>
              Intervalo entre Shorts
            </span>

            <div className="interval">
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) =>
                  setInterval(
                    Math.max(
                      1,
                      Number(e.target.value)
                    )
                  )
                }
              />

              <span>minutos</span>
            </div>
          </label>

          <label className="full-field">
            <span>
              Descripción global
            </span>

            <textarea
              placeholder="Descripción que tendrán tus Shorts..."
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
            />
          </label>

          <div className="form-grid">
            <label>
              <span>Categoría</span>
              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value
                  )
                }
              >
                <option value="24">
                  People & Blogs
                </option>
                <option value="22">
                  People & Blogs
                </option>
                <option value="20">
                  Gaming
                </option>
                <option value="23">
                  Comedy
                </option>
                <option value="24">
                  Entertainment
                </option>
              </select>
            </label>

            <label className="kids-option">
              <input
                type="checkbox"
                checked={madeForKids}
                onChange={(e) =>
                  setMadeForKids(
                    e.target.checked
                  )
                }
              />

              <span>
                Contenido creado para niños
              </span>
            </label>
          </div>
        </section>

        <section className="panel preview-panel">
          <div className="panel-title">
            <span>03</span>
            <div>
              <h2>Vista previa</h2>
              <p>
                Así quedará tu cola de
                publicación.
              </p>
            </div>
          </div>

          {schedule.length === 0 ? (
            <div className="empty">
              Selecciona tus Shorts para
              generar la programación.
            </div>
          ) : (
            <>
              <div className="schedule-summary">
                <div>
                  <strong>
                    {schedule.length}
                  </strong>
                  <span>Shorts</span>
                </div>

                <div>
                  <strong>
                    {interval}
                  </strong>
                  <span>minutos</span>
                </div>

                <div>
                  <strong>
                    {formatDate(
                      schedule[0].date
                    )}
                  </strong>
                  <span>primero</span>
                </div>

                <div>
                  <strong>
                    {formatDate(
                      schedule[
                        schedule.length - 1
                      ].date
                    )}
                  </strong>
                  <span>último</span>
                </div>
              </div>

              <div className="schedule-list">
                {schedule
                  .slice(0, 50)
                  .map((item) => (
                    <div
                      className="schedule-row"
                      key={`${item.index}-${item.file.name}`}
                    >
                      <div className="schedule-number">
                        {String(
                          item.index + 1
                        ).padStart(2, "0")}
                      </div>

                      <div className="schedule-file">
                        {item.file.name}
                      </div>

                      <time>
                        {formatDate(
                          item.date
                        )}
                      </time>
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <section className="results">
          <h2>Resultados</h2>

          {results.map((result, index) => (
            <div
              className={
                result.success
                  ? "result success"
                  : "result failed"
              }
              key={`${result.file}-${index}`}
            >
              <span>
                {result.success
                  ? "?"
                  : "!"}
              </span>

              <div>
                <strong>
                  {result.file}
                </strong>

                <small>
                  {result.success
                    ? `Programado para ${formatDate(
                        result.publishAt
                      )}`
                    : result.error}
                </small>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="action-bar">
        <div>
          {uploading ? (
            <>
              <strong>
                Subiendo {current} de{" "}
                {files.length}
              </strong>

              <div className="progress">
                <div
                  style={{
                    width: `${
                      (current /
                        Math.max(
                          files.length,
                          1
                        )) *
                      100
                    }%`,
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <strong>
                {files.length
                  ? `${files.length} Shorts listos`
                  : "Ningún Short seleccionado"}
              </strong>

              <span>
                Cada video se subirá y quedará
                programado automáticamente.
              </span>
            </>
          )}
        </div>

        <button
          className="main-button"
          onClick={uploadAll}
          disabled={
            uploading ||
            !files.length ||
            !connected
          }
        >
          {uploading
            ? `SUBIENDO ${current}/${files.length}...`
            : "?? SUBIR Y PROGRAMAR TODO"}
        </button>
      </div>
    </main>
  );
}


