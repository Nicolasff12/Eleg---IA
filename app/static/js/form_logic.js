function agregarAtributo() {
  const contenedor = document.getElementById("atributos-container");
  const div = document.createElement("div");
  div.className = "atributo";
  div.innerHTML = `
    <input type="text" name="atributos[]" placeholder="Nombre del atributo" required>
    <input type="number" name="pesos[]" placeholder="Peso" step="0.1" required>
  `;
  contenedor.appendChild(div);
}

function pasarAOpciones() {
  const paso1 = document.getElementById("paso-1");
  const paso2 = document.getElementById("paso-2");
  const valoresContainer = document.querySelector(".valores-container");

  // Obtener cantidad de atributos
  const atributos = document.querySelectorAll('input[name="atributos[]"]');
  if (atributos.length === 0) {
    alert("Agrega al menos un atributo");
    return;
  }

  // Agregar campos de valor para cada atributo en la primera opción
  atributos.forEach(attr => {
    const label = attr.value || "Atributo";
    const input = document.createElement("input");
    input.name = "valores_opciones[0][]";
    input.placeholder = `Valor para ${label}`;
    input.type = "number";
    input.step = "any";
    input.required = true;
    valoresContainer.appendChild(input);
  });

  paso1.style.display = "none";
  paso2.style.display = "block";
}

function agregarOpcion() {
  const opcionesContainer = document.getElementById("opciones-container");
  const index = opcionesContainer.children.length;
  const div = document.createElement("div");
  div.className = "opcion";
  div.innerHTML = `
    <input type="text" name="opciones[]" placeholder="Nombre de la opción" required>
    <div class="valores-container">
    </div>
  `;

  const atributos = document.querySelectorAll('input[name="atributos[]"]');
  const valoresDiv = div.querySelector(".valores-container");

  atributos.forEach(attr => {
    const label = attr.value || "Atributo";
    const input = document.createElement("input");
    input.name = `valores_opciones[${index}][]`;
    input.placeholder = `Valor para ${label}`;
    input.type = "number";
    input.step = "any";
    input.required = true;
    valoresDiv.appendChild(input);
  });

  opcionesContainer.appendChild(div);
}
