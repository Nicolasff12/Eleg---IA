let contador = 0;

function agregarCard() {
  const contenedor = document.getElementById("opciones-container");
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <label>Nombre de la opción:</label>
    <input type="text" name="nombre" placeholder="Ej: Candidato A">

    <label>Atributos (nombre:valor):</label>
    <textarea name="atributos" placeholder="ej: experiencia:5, creatividad:8"></textarea>
  `;

  contenedor.appendChild(card);
}

let opcionesGuardadas = [];

function guardarOpciones() {
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const nombre = card.querySelector('input[name="nombre"]').value;
    const atributosRaw = card.querySelector('textarea[name="atributos"]').value;

    if (!nombre || !atributosRaw) return;

    let atributos = {};
    atributosRaw.split(',').forEach(par => {
      let [clave, valor] = par.split(':');
      if (clave && valor) {
        atributos[clave.trim()] = parseFloat(valor.trim());
      }
    });

    opcionesGuardadas.push({ nombre, atributos });
  });

  document.getElementById("opciones-container").innerHTML = "";
  mostrarOpcionesGuardadas();
}

function mostrarOpcionesGuardadas() {
  const lista = document.getElementById("items-guardados");
  lista.innerHTML = "";

  opcionesGuardadas.forEach((opcion, index) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span><strong>${opcion.nombre}</strong>: ${JSON.stringify(opcion.atributos)}</span>
      <span>
        <button class="editar" onclick="editarOpcion(${index})">Editar</button>
        <button class="eliminar" onclick="eliminarOpcion(${index})">Eliminar</button>
      </span>
    `;
    lista.appendChild(item);
  });
}

function eliminarOpcion(index) {
  opcionesGuardadas.splice(index, 1);
  mostrarOpcionesGuardadas();
}

function editarOpcion(index) {
  const opcion = opcionesGuardadas[index];
  agregarCard();

  const lastCard = document.querySelectorAll(".card")[document.querySelectorAll(".card").length - 1];
  lastCard.querySelector('input[name="nombre"]').value = opcion.nombre;

  const atributosTexto = Object.entries(opcion.atributos)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");
  lastCard.querySelector('textarea[name="atributos"]').value = atributosTexto;

  opcionesGuardadas.splice(index, 1);
  mostrarOpcionesGuardadas();
}

async function realizarComparacion() {
  const contexto = document.getElementById("instruccion").value;
  let opciones = opcionesGuardadas;

  const contenedor = document.getElementById("resultado");
  contenedor.innerHTML = "<p>Comparando con IA...</p>";

  try {
    const response = await fetch("/api/comparar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ contexto, opciones })
    });

    const data = await response.json();

    const resultados = JSON.parse(data.resultado);
    const extra = data.resultado_extra ? JSON.parse(data.resultado_extra) : null;

    const tabla = document.createElement("table");
    tabla.innerHTML = `
      <thead>
        <tr><th>Nombre</th><th>Puntaje</th><th>Razón</th></tr>
      </thead>
      <tbody>
        ${resultados.map(r => `
          <tr>
            <td>${r.nombre}</td>
            <td>${r.puntaje}</td>
            <td>${r.razon}</td>
          </tr>`).join("")}
      </tbody>
    `;

    const mejorDiv = document.createElement("div");
    mejorDiv.classList.add("mejor-opcion");

    if (extra?.mejor) {
      mejorDiv.innerHTML = `
        <h3>✅ Mejor opción: ${extra.mejor}</h3>
        <p>${extra.razon_mejor}</p>
      `;
    }

    contenedor.innerHTML = ""; // Limpia lo anterior
    contenedor.appendChild(tabla);
    contenedor.appendChild(mejorDiv);

  } catch (err) {
    contenedor.innerHTML = `<p>❌ Error al interpretar la respuesta de la IA:</p><pre>${err.message}</pre>`;
  }
}
