
    let optionCount = 2;
    let isMultiComparison = false;
    let caracteristicas = new Set();
    let datosComparacion = {};
    let tipoComparacion = null;

    function agregarOpcion() {
      optionCount++;
      
      // Si hay más de 2 opciones, cambiar a vista de grid
      if (optionCount > 2 && !isMultiComparison) {
        cambiarAMultiComparacion();
      }

      const optionHtml = `
        <div class="option-panel" id="option-${optionCount}" style="animation: fadeIn 0.3s ease-out;">
          <button class="btn btn-danger remove-option" onclick="eliminarOpcion(${optionCount})">✕</button>
          <div class="option-header">
            <input 
              type="text" 
              class="option-title-input" 
              placeholder="Nombre de la opción"
              id="nombre-opcion-${optionCount}"
              onchange="actualizarCaracteristicas()"
              oninput="mostrarBotonAutoLlenar(${optionCount})"
              onblur="habilitarAutoSugerir(${optionCount})"
            />
          </div>
          <div class="option-score" style="display: none;">
            <div class="score-label">Puntuación</div>
            <div class="score-value">-</div>
          </div>
          <div class="attributes-section">
            <div class="attributes-header">
              <label class="attributes-label">Atributos (nombre:valor)</label>
              <button class="auto-suggest-btn" onclick="sugerirAtributos(${optionCount})" id="suggest-btn-${optionCount}" style="display: none;">
                ✨ Auto-llenar
              </button>
            </div>
            <textarea 
              class="attributes-input"
              placeholder="ej: precio:1000, bateria:5000, camara:48"
              id="atributos-opcion-${optionCount}"
              onchange="actualizarCaracteristicas()"
            ></textarea>
          </div>
        </div>
      `;

      if (isMultiComparison) {
        document.getElementById('multi-comparison').insertAdjacentHTML('beforeend', optionHtml);
      }
    }

    function mostrarBotonAutoLlenar(optionId) {
      const nombreInput = document.getElementById(`nombre-opcion-${optionId}`);
      const suggestBtn = document.getElementById(`suggest-btn-${optionId}`);
      
      if (nombreInput && suggestBtn) {
        if (nombreInput.value.trim().length > 2) {
          suggestBtn.style.display = 'inline-flex';
        } else {
          suggestBtn.style.display = 'none';
        }
      }
    }

    function habilitarAutoSugerir(optionId) {
      const nombreInput = document.getElementById(`nombre-opcion-${optionId}`);
      const suggestBtn = document.getElementById(`suggest-btn-${optionId}`);
      
      if (nombreInput && nombreInput.value.trim() && suggestBtn) {
        suggestBtn.style.display = 'inline-flex';
      }
    }

    // Detectar cuando se escribe en el campo de contexto
    document.getElementById('instruccion').addEventListener('blur', async function() {
      const contexto = this.value.trim();
      if (contexto) {
        await detectarTipoComparacion(contexto);
      }
    });

    // Habilitar botones de auto-sugerir cuando se escriba un nombre
    document.getElementById('nombre-opcion-1').addEventListener('input', function() {
      mostrarBotonAutoLlenar(1);
    });

    document.getElementById('nombre-opcion-2').addEventListener('input', function() {
      mostrarBotonAutoLlenar(2);
    });

    async function detectarTipoComparacion(contexto) {
      try {
        const response = await fetch('/api/detectar-tipo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contexto })
        });
        
        const data = await response.json();
        
        if (data.success) {
          tipoComparacion = data;
          console.log('Tipo de comparación detectado:', data.tipo);
          
          // Actualizar placeholders con sugerencias
          updatePlaceholders(data.atributos_sugeridos);
        }
      } catch (error) {
        console.error('Error al detectar tipo:', error);
      }
    }

    function updatePlaceholders(atributosSugeridos) {
      if (atributosSugeridos && atributosSugeridos.length > 0) {
        const ejemplos = atributosSugeridos.slice(0, 3).join(', ');
        document.querySelectorAll('.attributes-input').forEach(input => {
          input.placeholder = `ej: ${ejemplos}...`;
        });
      }
    }

    async function sugerirAtributos(optionId) {
      const contexto = document.getElementById('instruccion').value;
      const nombreOpcion = document.getElementById(`nombre-opcion-${optionId}`).value;
      const suggestBtn = document.getElementById(`suggest-btn-${optionId}`);
      const atributosTextarea = document.getElementById(`atributos-opcion-${optionId}`);
      
      if (!contexto || !nombreOpcion) {
        alert('Por favor, ingresa primero qué deseas comparar y el nombre de la opción');
        return;
      }
      
      // Mostrar estado de carga
      suggestBtn.classList.add('loading');
      suggestBtn.innerHTML = '⏳ Cargando...';
      suggestBtn.disabled = true;
      
      try {
        const response = await fetch('/api/sugerir-atributos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            contexto, 
            nombre_opcion: nombreOpcion 
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.atributos) {
          // Formatear los atributos sugeridos
          const atributosFormateados = Object.entries(data.atributos)
            .map(([key, value]) => `${key}:${value}`)
            .join(', ');
          
          // Animar el llenado automático
          atributosTextarea.value = atributosFormateados;
          atributosTextarea.classList.add('auto-filled');
          
          // Agregar indicador de auto-llenado
          const indicator = document.createElement('span');
          indicator.className = 'auto-fill-indicator';
          indicator.textContent = `✓ Auto-completado (${data.categoria})`;
          suggestBtn.parentElement.appendChild(indicator);
          
          // Remover el indicador después de 3 segundos
          setTimeout(() => {
            indicator.remove();
            atributosTextarea.classList.remove('auto-filled');
          }, 3000);
          
          // Actualizar características
          actualizarCaracteristicas();
          
          // Cambiar el botón a estado de éxito
          suggestBtn.innerHTML = '✓ Listo';
          setTimeout(() => {
            suggestBtn.innerHTML = '✨ Auto-llenar';
            suggestBtn.classList.remove('loading');
            suggestBtn.disabled = false;
          }, 2000);
          
        } else {
          throw new Error('No se pudieron obtener sugerencias');
        }
        
      } catch (error) {
        console.error('Error:', error);
        alert('Error al obtener sugerencias. Por favor, intenta de nuevo.');
        
        // Restaurar botón
        suggestBtn.innerHTML = '✨ Auto-llenar';
        suggestBtn.classList.remove('loading');
        suggestBtn.disabled = false;
      }
    }

    function cambiarAMultiComparacion() {
      isMultiComparison = true;
      const dualComparison = document.getElementById('dual-comparison');
      const multiComparison = document.getElementById('multi-comparison');
      
      // Mover las opciones existentes al grid
      const option1 = document.getElementById('option-1');
      const option2 = document.getElementById('option-2');
      
      option1.querySelector('.remove-option').style.display = 'block';
      option2.querySelector('.remove-option').style.display = 'block';
      
      multiComparison.appendChild(option1);
      multiComparison.appendChild(option2);
      
      dualComparison.style.display = 'none';
      multiComparison.style.display = 'grid';
    }

    function eliminarOpcion(id) {
      const option = document.getElementById(`option-${id}`);
      option.remove();
      optionCount--;
      actualizarCaracteristicas();
    }

    function actualizarCaracteristicas() {
      caracteristicas.clear();
      datosComparacion = {};
      
      // Recolectar todas las características de todas las opciones
      for (let i = 1; i <= optionCount + 5; i++) {
        const nombreInput = document.getElementById(`nombre-opcion-${i}`);
        const atributosInput = document.getElementById(`atributos-opcion-${i}`);
        
        if (nombreInput && atributosInput && nombreInput.value) {
          const nombre = nombreInput.value;
          datosComparacion[nombre] = {};
          
          // Parsear atributos
          const atributosTexto = atributosInput.value;
          const atributos = atributosTexto.split(',').map(attr => attr.trim());
          
          atributos.forEach(attr => {
            const [key, value] = attr.split(':').map(s => s.trim());
            if (key && value) {
              caracteristicas.add(key);
              datosComparacion[nombre][key] = parseFloat(value) || value;
            }
          });
        }
      }
      
      // Generar filtros si hay características
      if (caracteristicas.size > 0) {
        generarFiltros();
      }
    }

    function generarFiltros() {
      const filtersSection = document.getElementById('filters-section');
      const filtersContainer = document.getElementById('filters-container');
      
      if (caracteristicas.size > 0 && Object.keys(datosComparacion).length > 1) {
        filtersSection.style.display = 'block';
        filtersContainer.innerHTML = '';
        
        caracteristicas.forEach(caract => {
          const btn = document.createElement('button');
          btn.className = 'filter-btn';
          btn.onclick = () => filtrarPorCaracteristica(caract, btn);
          
          // Determinar si menor es mejor basándose en el tipo de comparación
          let menorEsMejor = false;
          if (tipoComparacion && tipoComparacion.direccion_mejora && 
              tipoComparacion.direccion_mejora[caract] === 'menor') {
            menorEsMejor = true;
          }
          
          // Encontrar el mejor valor para esta característica
          let mejorValor = menorEsMejor ? Infinity : -Infinity;
          let mejorOpcion = '';
          
          Object.entries(datosComparacion).forEach(([opcion, attrs]) => {
            const valor = attrs[caract];
            if (valor && !isNaN(valor)) {
              if ((menorEsMejor && valor < mejorValor) || 
                  (!menorEsMejor && valor > mejorValor)) {
                mejorValor = valor;
                mejorOpcion = opcion;
              }
            }
          });
          
          btn.innerHTML = `
            ${caract}
            <span class="badge">${mejorOpcion ? '🏆 ' + mejorOpcion : '?'}</span>
          `;
          
          filtersContainer.appendChild(btn);
        });
      } else {
        filtersSection.style.display = 'none';
      }
    }

    async function realizarComparacion() {
      // Actualizar características antes de comparar
      actualizarCaracteristicas();
      
      // Obtener contexto
      const contexto = document.getElementById('instruccion').value;
      
      if (!contexto) {
        alert('Por favor ingresa qué deseas comparar');
        return;
      }
      
      // Recopilar opciones
      const opciones = [];
      Object.entries(datosComparacion).forEach(([nombre, atributos]) => {
        if (nombre && Object.keys(atributos).length > 0) {
          opciones.push({ nombre, atributos });
        }
      });
      
      if (opciones.length < 2) {
        alert('Por favor ingresa al menos 2 opciones con sus atributos');
        return;
      }
      
      // Mostrar loading
      const resultadoDiv = document.getElementById('resultado');
      resultadoDiv.style.display = 'block';
      const resultadoContenido = document.getElementById('resultado-contenido');
      resultadoContenido.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div><p>Analizando opciones con IA...</p></div>';
      
      try {
        // Llamar a la API
        const response = await fetch('/api/analizar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contexto, opciones })
        });
        
        const data = await response.json();
        
        if (data.success) {
          mostrarResultadosIA(data.resultados, data.mejor);
          
          // Actualizar puntuaciones en las cards
          data.resultados.forEach(resultado => {
            actualizarPuntuacionCard(resultado.nombre, resultado.puntaje);
          });
          
          // Si hay características, mostrar también los filtros
          if (caracteristicas.size > 0) {
            document.getElementById('filters-section').style.display = 'block';
            verTodasCaracteristicas();
          }
        } else {
          resultadoContenido.innerHTML = '<div class="alert alert-error">Error al analizar las opciones</div>';
        }
        
      } catch (error) {
        console.error('Error:', error);
        resultadoContenido.innerHTML = '<div class="alert alert-error">Error de conexión con el servidor</div>';
      }
    }
    
    function mostrarResultadosIA(resultados, mejor) {
      const resultadoContenido = document.getElementById('resultado-contenido');
      
      let html = `
        <div class="ai-analysis">
          <h3>🤖 Análisis de IA</h3>
          <div class="ai-content">
      `;
      
      // Mostrar tabla de resultados
      html += `
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Opción</th>
              <th>Puntuación</th>
              <th>Análisis</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      resultados.forEach(resultado => {
        const esMejor = mejor.mejor === resultado.nombre;
        html += `
          <tr class="${esMejor ? 'winner-row' : ''}">
            <td class="${esMejor ? 'winner-cell' : ''}">${resultado.nombre} ${esMejor ? '🏆' : ''}</td>
            <td style="text-align: center; font-weight: bold; font-size: 1.2em;">${resultado.puntaje}/10</td>
            <td>${resultado.razon}</td>
          </tr>
        `;
      });
      
      html += `
          </tbody>
        </table>
      `;
      
      // Mostrar recomendación final
      if (mejor.mejor) {
        html += `
          <div class="ai-recommendation">
            <h4>✨ Recomendación Final</h4>
            <div class="recommendation-box">
              <p><strong>Mejor opción:</strong> ${mejor.mejor}</p>
              <p>${mejor.razon_mejor}</p>
            </div>
          </div>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
        
    let optionCount = 2;
    let isMultiComparison = false;
    let caracteristicas = new Set();
    let datosComparacion = {};

    function agregarOpcion() {
      optionCount++;
      
      // Si hay más de 2 opciones, cambiar a vista de grid
      if (optionCount > 2 && !isMultiComparison) {
        cambiarAMultiComparacion();
      }

      const optionHtml = `
        <div class="option-panel" id="option-${optionCount}" style="animation: fadeIn 0.3s ease-out;">
          <button class="btn btn-danger remove-option" onclick="eliminarOpcion(${optionCount})">✕</button>
          <div class="option-header">
            <input 
              type="text" 
              class="option-title-input" 
              placeholder="Nombre de la opción"
              id="nombre-opcion-${optionCount}"
              onchange="actualizarCaracteristicas()"
            />
          </div>
          <div class="option-score" style="display: none;">
            <div class="score-label">Puntuación</div>
            <div class="score-value">-</div>
          </div>
          <div class="attributes-section">
            <label class="attributes-label">Atributos (nombre:valor)</label>
            <textarea 
              class="attributes-input"
              placeholder="ej: precio:1000, bateria:5000, camara:48"
              id="atributos-opcion-${optionCount}"
              onchange="actualizarCaracteristicas()"
            ></textarea>
          </div>
        </div>
      `;

      if (isMultiComparison) {
        document.getElementById('multi-comparison').insertAdjacentHTML('beforeend', optionHtml);
      }
    }

    function cambiarAMultiComparacion() {
      isMultiComparison = true;
      const dualComparison = document.getElementById('dual-comparison');
      const multiComparison = document.getElementById('multi-comparison');
      
      // Mover las opciones existentes al grid
      const option1 = document.getElementById('option-1');
      const option2 = document.getElementById('option-2');
      
      option1.querySelector('.remove-option').style.display = 'block';
      option2.querySelector('.remove-option').style.display = 'block';
      
      multiComparison.appendChild(option1);
      multiComparison.appendChild(option2);
      
      dualComparison.style.display = 'none';
      multiComparison.style.display = 'grid';
    }

    function eliminarOpcion(id) {
      const option = document.getElementById(`option-${id}`);
      option.remove();
      optionCount--;
      actualizarCaracteristicas();
    }

    function actualizarCaracteristicas() {
      caracteristicas.clear();
      datosComparacion = {};
      
      // Recolectar todas las características de todas las opciones
      for (let i = 1; i <= optionCount + 5; i++) {
        const nombreInput = document.getElementById(`nombre-opcion-${i}`);
        const atributosInput = document.getElementById(`atributos-opcion-${i}`);
        
        if (nombreInput && atributosInput && nombreInput.value) {
          const nombre = nombreInput.value;
          datosComparacion[nombre] = {};
          
          // Parsear atributos
          const atributosTexto = atributosInput.value;
          const atributos = atributosTexto.split(',').map(attr => attr.trim());
          
          atributos.forEach(attr => {
            const [key, value] = attr.split(':').map(s => s.trim());
            if (key && value) {
              caracteristicas.add(key);
              datosComparacion[nombre][key] = parseFloat(value) || value;
            }
          });
        }
      }
      
      // Generar filtros si hay características
      if (caracteristicas.size > 0) {
        generarFiltros();
      }
    }

    function generarFiltros() {
      const filtersSection = document.getElementById('filters-section');
      const filtersContainer = document.getElementById('filters-container');
      
      if (caracteristicas.size > 0 && Object.keys(datosComparacion).length > 1) {
        filtersSection.style.display = 'block';
        filtersContainer.innerHTML = '';
        
        caracteristicas.forEach(caract => {
          const btn = document.createElement('button');
          btn.className = 'filter-btn';
          btn.onclick = () => filtrarPorCaracteristica(caract, btn);
          
          // Encontrar el mejor valor para esta característica
          let mejorValor = -Infinity;
          let mejorOpcion = '';
          
          Object.entries(datosComparacion).forEach(([opcion, attrs]) => {
            const valor = attrs[caract];
            if (valor && !isNaN(valor) && valor > mejorValor) {
              mejorValor = valor;
              mejorOpcion = opcion;
            }
          });
          
          btn.innerHTML = `
            ${caract}
            <span class="badge">${mejorOpcion ? '🏆 ' + mejorOpcion : '?'}</span>
          `;
          
          filtersContainer.appendChild(btn);
        });
      } else {
        filtersSection.style.display = 'none';
      }
    }

    function filtrarPorCaracteristica(caracteristica, btn) {
      // Actualizar botones activos
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Mostrar comparación de esta característica
      const detailsContainer = document.getElementById('characteristic-details');
      detailsContainer.innerHTML = '';
      
      const comparisonDiv = document.createElement('div');
      comparisonDiv.className = 'characteristic-comparison';
      
      // Título de la característica
      const title = document.createElement('div');
      title.className = 'characteristic-name';
      title.textContent = `Comparación de ${caracteristica}`;
      comparisonDiv.appendChild(title);
      
      // Contenedor de opciones
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'options-comparison';
      
      // Encontrar el mejor valor
      let mejorValor = -Infinity;
      let valores = [];
      
      Object.entries(datosComparacion).forEach(([opcion, attrs]) => {
        const valor = attrs[caracteristica];
        if (valor && !isNaN(valor)) {
          valores.push({ opcion, valor: parseFloat(valor) });
          if (parseFloat(valor) > mejorValor) {
            mejorValor = parseFloat(valor);
          }
        }
      });
      
      // Ordenar de mayor a menor
      valores.sort((a, b) => b.valor - a.valor);
      
      // Crear cards para cada opción
      valores.forEach((item, index) => {
        const optionValue = document.createElement('div');
        optionValue.className = 'option-value';
        if (index === 0) {
          optionValue.classList.add('best');
        }
        
        optionValue.innerHTML = `
          <div class="option-value-name">${item.opcion}</div>
          <div class="option-value-number">${item.valor}</div>
          ${index === 0 ? '<span class="best-indicator">Mejor opción</span>' : ''}
        `;
        
        optionsDiv.appendChild(optionValue);
      });
      
      comparisonDiv.appendChild(optionsDiv);
      detailsContainer.appendChild(comparisonDiv);
      
      // Agregar resumen
      mostrarResumenComparacion();
    }

    function verTodasCaracteristicas() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      
      const detailsContainer = document.getElementById('characteristic-details');
      detailsContainer.innerHTML = '';
      
      // Mostrar todas las características
      caracteristicas.forEach(caract => {
        const comparisonDiv = document.createElement('div');
        comparisonDiv.className = 'characteristic-comparison';
        
        const title = document.createElement('div');
        title.className = 'characteristic-name';
        title.textContent = caract;
        comparisonDiv.appendChild(title);
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options-comparison';
        
        let valores = [];
        Object.entries(datosComparacion).forEach(([opcion, attrs]) => {
          const valor = attrs[caract];
          if (valor) {
            valores.push({ opcion, valor: parseFloat(valor) || valor });
          }
        });
        
        // Ordenar si son números
        if (valores.every(v => !isNaN(v.valor))) {
          valores.sort((a, b) => b.valor - a.valor);
        }
        
        valores.forEach((item, index) => {
          const optionValue = document.createElement('div');
          optionValue.className = 'option-value';
          if (index === 0 && !isNaN(item.valor)) {
            optionValue.classList.add('best');
          }
          
          optionValue.innerHTML = `
            <div class="option-value-name">${item.opcion}</div>
            <div class="option-value-number">${item.valor}</div>
            ${index === 0 && !isNaN(item.valor) ? '<span class="best-indicator">Mejor</span>' : ''}
          `;
          
          optionsDiv.appendChild(optionValue);
        });
        
        comparisonDiv.appendChild(optionsDiv);
        detailsContainer.appendChild(comparisonDiv);
      });
      
      mostrarResumenComparacion();
    }

    function mostrarResumenComparacion() {
      // Calcular cuántas veces cada opción es la mejor
      const victorias = {};
      
      Object.keys(datosComparacion).forEach(opcion => {
        victorias[opcion] = 0;
      });
      
      caracteristicas.forEach(caract => {
        let mejorValor = -Infinity;
        let mejorOpcion = '';
        
        Object.entries(datosComparacion).forEach(([opcion, attrs]) => {
          const valor = attrs[caract];
          if (valor && !isNaN(valor) && parseFloat(valor) > mejorValor) {
            mejorValor = parseFloat(valor);
            mejorOpcion = opcion;
          }
        });
        
        if (mejorOpcion) {
          victorias[mejorOpcion]++;
        }
      });
      
      // Crear resumen
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'comparison-summary';
      
      summaryDiv.innerHTML = '<div class="summary-title">📊 Resumen de comparación</div>';
      
      // Ordenar por victorias
      const ordenados = Object.entries(victorias).sort((a, b) => b[1] - a[1]);
      
      ordenados.forEach(([opcion, wins]) => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        item.innerHTML = `
          <span>${opcion}</span>
          <span class="winner-count">${wins} características mejor</span>
        `;
        summaryDiv.appendChild(item);
      });
      
      document.getElementById('characteristic-details').appendChild(summaryDiv);
    }

    function mostrarGuardados() {
      const guardados = document.getElementById('lista-guardados');
      guardados.style.display = guardados.style.display === 'none' ? 'block' : 'none';
    }

    // Placeholder para funciones existentes
    function guardarOpciones() {
      // Llamar a la función original
      if (window.guardarOpcionesOriginal) {
        window.guardarOpcionesOriginal();
      }
    }

    async function realizarComparacion() {
      // Actualizar características antes de comparar
      actualizarCaracteristicas();
      
      // Obtener contexto
      const contexto = document.getElementById('instruccion').value;
      
      if (!contexto) {
        alert('Por favor ingresa qué deseas comparar');
        return;
      }
      
      // Recopilar opciones
      const opciones = [];
      Object.entries(datosComparacion).forEach(([nombre, atributos]) => {
        if (nombre && Object.keys(atributos).length > 0) {
          opciones.push({ nombre, atributos });
        }
      });
      
      if (opciones.length < 2) {
        alert('Por favor ingresa al menos 2 opciones con sus atributos');
        return;
      }
      
      // Mostrar loading
      const resultadoDiv = document.getElementById('resultado');
      resultadoDiv.style.display = 'block';
      const resultadoContenido = document.getElementById('resultado-contenido');
      resultadoContenido.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div><p>Analizando opciones con IA...</p></div>';
      
      try {
        // Llamar a la API
        const response = await fetch('/api/analizar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contexto, opciones })
        });
        
        const data = await response.json();
        
        if (data.success) {
          mostrarResultadosIA(data.resultados, data.mejor);
          
          // Actualizar puntuaciones en las cards
          data.resultados.forEach(resultado => {
            actualizarPuntuacionCard(resultado.nombre, resultado.puntaje);
          });
          
          // Si hay características, mostrar también los filtros
          if (caracteristicas.size > 0) {
            document.getElementById('filters-section').style.display = 'block';
            verTodasCaracteristicas();
          }
        } else {
          resultadoContenido.innerHTML = '<div class="alert alert-error">Error al analizar las opciones</div>';
        }
        
      } catch (error) {
        console.error('Error:', error);
        resultadoContenido.innerHTML = '<div class="alert alert-error">Error de conexión con el servidor</div>';
      }
    }
    
    function mostrarResultadosIA(resultados, mejor) {
      const resultadoContenido = document.getElementById('resultado-contenido');
      
      let html = `
        <div class="ai-analysis">
          <h3>🤖 Análisis de IA</h3>
          <div class="ai-content">
      `;
      
      // Mostrar tabla de resultados
      html += `
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Opción</th>
              <th>Puntuación</th>
              <th>Análisis</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      resultados.forEach(resultado => {
        const esMejor = mejor.mejor === resultado.nombre;
        html += `
          <tr class="${esMejor ? 'winner-row' : ''}">
            <td class="${esMejor ? 'winner-cell' : ''}">${resultado.nombre} ${esMejor ? '🏆' : ''}</td>
            <td style="text-align: center; font-weight: bold; font-size: 1.2em;">${resultado.puntaje}/10</td>
            <td>${resultado.razon}</td>
          </tr>
        `;
      });
      
      html += `
          </tbody>
        </table>
      `;
      
      // Mostrar recomendación final
      if (mejor.mejor) {
        html += `
          <div class="ai-recommendation">
            <h4>✨ Recomendación Final</h4>
            <div class="recommendation-box">
              <p><strong>Mejor opción:</strong> ${mejor.mejor}</p>
              <p>${mejor.razon_mejor}</p>
            </div>
          </div>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
      
      resultadoContenido.innerHTML = html;
    }
    }
    
    function actualizarPuntuacionCard(nombre, puntuacion) {
      // Buscar la card correspondiente
      for (let i = 1; i <= optionCount + 5; i++) {
        const nombreInput = document.getElementById(`nombre-opcion-${i}`);
        if (nombreInput && nombreInput.value === nombre) {
          const card = document.getElementById(`option-${i}`);
          const scoreDiv = card.querySelector('.option-score');
          const scoreValue = card.querySelector('.score-value');
          
          scoreDiv.style.display = 'block';
          scoreValue.textContent = puntuacion;
          
          // Si es la mejor puntuación, agregar clase winner
          if (puntuacion >= 8) {
            card.classList.add('winner');
          }
          
          break;
        }
      }
    }
    
    async function filtrarPorCaracteristica(caracteristica, btn) {
      // Actualizar botones activos
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Mostrar comparación visual de esta característica (código existente)
      mostrarComparacionCaracteristica(caracteristica);
      
      // Obtener análisis de IA para esta característica
      const contexto = document.getElementById('instruccion').value;
      const opciones = [];
      Object.entries(datosComparacion).forEach(([nombre, atributos]) => {
        if (nombre && Object.keys(atributos).length > 0) {
          opciones.push({ nombre, atributos });
        }
      });
      
      if (contexto && opciones.length >= 2) {
        // Mostrar loading en el área de detalles
        const detailsContainer = document.getElementById('characteristic-details');
        const loadingDiv = document.createElement('div');
        loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="spinner-small"></div><p>Analizando ' + caracteristica + '...</p></div>';
        detailsContainer.appendChild(loadingDiv);
        
        try {
          const response = await fetch('/api/analizar-caracteristica', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contexto, opciones, caracteristica })
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Remover loading
            loadingDiv.remove();
            
            // Agregar análisis de IA
            const aiDiv = document.createElement('div');
            aiDiv.className = 'ai-analysis';
            aiDiv.innerHTML = `
              <h3>🤖 Análisis de IA para ${caracteristica}</h3>
              <div class="ai-content">
                <p><strong>Mejor en ${caracteristica}:</strong> ${data.mejor.mejor}</p>
                <p>${data.mejor.razon_mejor}</p>
              </div>
            `;
            detailsContainer.appendChild(aiDiv);
          }
          
        } catch (error) {
          console.error('Error:', error);
          loadingDiv.innerHTML = '<p style="color: red;">Error al obtener análisis de IA</p>';
        }
      }
    }
    
    function mostrarComparacionCaracteristica(caracteristica) {
      // Código existente para mostrar la comparación visual
      const detailsContainer = document.getElementById('characteristic-details');
      detailsContainer.innerHTML = '';
      
      const comparisonDiv = document.createElement('div');
      comparisonDiv.className = 'characteristic-comparison';
      
      const title = document.createElement('div');
      title.className = 'characteristic-name';
      title.textContent = `Comparación de ${caracteristica}`;
      comparisonDiv.appendChild(title);
      
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'options-comparison';
      
      // Determinar si menor es mejor
      let menorEsMejor = false;
      if (tipoComparacion && tipoComparacion.direccion_mejora && 
          tipoComparacion.direccion_mejora[caracteristica] === 'menor') {
        menorEsMejor = true;
      }
      
      let mejorValor = menorEsMejor ? Infinity : -Infinity;
      let valores = [];
      
      Object.entries(datosComparacion).forEach(([opcion, attrs]) => {
        const valor = attrs[caracteristica];
        if (valor && !isNaN(valor)) {
          valores.push({ opcion, valor: parseFloat(valor) });
        }
      });
      
      // Ordenar según si menor o mayor es mejor
      valores.sort((a, b) => menorEsMejor ? a.valor - b.valor : b.valor - a.valor);
      
      valores.forEach((item, index) => {
        const optionValue = document.createElement('div');
        optionValue.className = 'option-value';
        if (index === 0) {
          optionValue.classList.add('best');
        }
        
        optionValue.innerHTML = `
          <div class="option-value-name">${item.opcion}</div>
          <div class="option-value-number">${item.valor}</div>
          ${index === 0 ? `<span class="best-indicator">Mejor ${menorEsMejor ? '(menor)' : '(mayor)'}</span>` : ''}
        `;
        
        optionsDiv.appendChild(optionValue);
      });
      
      comparisonDiv.appendChild(optionsDiv);
      detailsContainer.appendChild(comparisonDiv);
    }

    function verTodasCaracteristicas() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      
      const detailsContainer = document.getElementById('characteristic-details');
      detailsContainer.innerHTML = '';
      
      // Mostrar todas las características
      caracteristicas.forEach(caract => {
        const comparisonDiv = document.createElement('div');
        comparisonDiv.className = 'characteristic-comparison';
        
        const title = document.createElement('div');
        title.className = 'characteristic-name';
        title.textContent = caract;
        comparisonDiv.appendChild(title);
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options-comparison';
        
        // Determinar si menor es mejor
        let menorEsMejor = false;
        if (tipoComparacion && tipoComparacion.direccion_mejora && 
            tipoComparacion.direccion_mejora[caract] === 'menor') {
          menorEsMejor = true;
        }
        
        let valores = [];
        Object.entries(datosComparacion).forEach(([opcion, attrs]) => {
          const valor = attrs[caract];
          if (valor) {
            valores.push({ opcion, valor: parseFloat(valor) || valor });
          }
        });
        
        // Ordenar si son números
        if (valores.every(v => !isNaN(v.valor))) {
          valores.sort((a, b) => menorEsMejor ? a.valor - b.valor : b.valor - a.valor);
        }
        
        valores.forEach((item, index) => {
          const optionValue = document.createElement('div');
          optionValue.className = 'option-value';
          if (index === 0 && !isNaN(item.valor)) {
            optionValue.classList.add('best');
          }
          
          optionValue.innerHTML = `
            <div class="option-value-name">${item.opcion}</div>
            <div class="option-value-number">${item.valor}</div>
            ${index === 0 && !isNaN(item.valor) ? `<span class="best-indicator">Mejor ${menorEsMejor ? '(menor)' : ''}</span>` : ''}
          `;
          
          optionsDiv.appendChild(optionValue);
        });
        
        comparisonDiv.appendChild(optionsDiv);
        detailsContainer.appendChild(comparisonDiv);
      });
      
      mostrarResumenComparacion();
    }

    function mostrarResumenComparacion() {
      // Calcular cuántas veces cada opción es la mejor
      const victorias = {};
      
      Object.keys(datosComparacion).forEach(opcion => {
        victorias[opcion] = 0;
      });
      
      caracteristicas.forEach(caract => {
        let mejorValor = -Infinity;
        let mejorOpcion = '';
        
        // Determinar si menor es mejor para esta característica
        let menorEsMejor = false;
        if (tipoComparacion && tipoComparacion.direccion_mejora && 
            tipoComparacion.direccion_mejora[caract] === 'menor') {
          menorEsMejor = true;
          mejorValor = Infinity;
        }
        
        Object.entries(datosComparacion).forEach(([opcion, attrs]) => {
          const valor = attrs[caract];
          if (valor && !isNaN(valor)) {
            if ((menorEsMejor && parseFloat(valor) < mejorValor) || 
                (!menorEsMejor && parseFloat(valor) > mejorValor)) {
              mejorValor = parseFloat(valor);
              mejorOpcion = opcion;
            }
          }
        });
        
        if (mejorOpcion) {
          victorias[mejorOpcion]++;
        }
      });
      
      // Crear resumen
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'comparison-summary';
      
      summaryDiv.innerHTML = '<div class="summary-title">📊 Resumen de comparación</div>';
      
      // Ordenar por victorias
      const ordenados = Object.entries(victorias).sort((a, b) => b[1] - a[1]);
      
      ordenados.forEach(([opcion, wins]) => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        item.innerHTML = `
          <span>${opcion}</span>
          <span class="winner-count">${wins} características mejor</span>
        `;
        summaryDiv.appendChild(item);
      });
      
      document.getElementById('characteristic-details').appendChild(summaryDiv);
    }

    function mostrarGuardados() {
      const guardados = document.getElementById('lista-guardados');
      guardados.style.display = guardados.style.display === 'none' ? 'block' : 'none';
    }

    // Placeholder para funciones existentes
    function guardarOpciones() {
      // Llamar a la función original
      if (window.guardarOpcionesOriginal) {
        window.guardarOpcionesOriginal();
      }
    }
  
    
    function actualizarPuntuacionCard(nombre, puntuacion) {
      // Buscar la card correspondiente
      for (let i = 1; i <= optionCount + 5; i++) {
        const nombreInput = document.getElementById(`nombre-opcion-${i}`);
        if (nombreInput && nombreInput.value === nombre) {
          const card = document.getElementById(`option-${i}`);
          const scoreDiv = card.querySelector('.option-score');
          const scoreValue = card.querySelector('.score-value');
          
          scoreDiv.style.display = 'block';
          scoreValue.textContent = puntuacion;
          
          // Si es la mejor puntuación, agregar clase winner
          if (puntuacion >= 8) {
            card.classList.add('winner');
          }
          
          break;
        }
      }
    }
    
    async function filtrarPorCaracteristica(caracteristica, btn) {
      // Actualizar botones activos
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Mostrar comparación visual de esta característica (código existente)
      mostrarComparacionCaracteristica(caracteristica);
      
      // Obtener análisis de IA para esta característica
      const contexto = document.getElementById('instruccion').value;
      const opciones = [];
      Object.entries(datosComparacion).forEach(([nombre, atributos]) => {
        if (nombre && Object.keys(atributos).length > 0) {
          opciones.push({ nombre, atributos });
        }
      });
      
      if (contexto && opciones.length >= 2) {
        // Mostrar loading en el área de detalles
        const detailsContainer = document.getElementById('characteristic-details');
        const loadingDiv = document.createElement('div');
        loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="spinner-small"></div><p>Analizando ' + caracteristica + '...</p></div>';
        detailsContainer.appendChild(loadingDiv);
        
        try {
          const response = await fetch('/api/analizar-caracteristica', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contexto, opciones, caracteristica })
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Remover loading
            loadingDiv.remove();
            
            // Agregar análisis de IA
            const aiDiv = document.createElement('div');
            aiDiv.className = 'ai-analysis';
            aiDiv.innerHTML = `
              <h3>🤖 Análisis de IA para ${caracteristica}</h3>
              <div class="ai-content">
                <p><strong>Mejor en ${caracteristica}:</strong> ${data.mejor.mejor}</p>
                <p>${data.mejor.razon_mejor}</p>
              </div>
            `;
            detailsContainer.appendChild(aiDiv);
          }
          
        } catch (error) {
          console.error('Error:', error);
          loadingDiv.innerHTML = '<p style="color: red;">Error al obtener análisis de IA</p>';
        }
      }
    }
    
    function mostrarComparacionCaracteristica(caracteristica) {
      // Código existente para mostrar la comparación visual
      const detailsContainer = document.getElementById('characteristic-details');
      detailsContainer.innerHTML = '';
      
      const comparisonDiv = document.createElement('div');
      comparisonDiv.className = 'characteristic-comparison';
      
      const title = document.createElement('div');
      title.className = 'characteristic-name';
      title.textContent = `Comparación de ${caracteristica}`;
      comparisonDiv.appendChild(title);
      
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'options-comparison';
      
      let mejorValor = -Infinity;
      let valores = [];
      
      Object.entries(datosComparacion).forEach(([opcion, attrs]) => {
        const valor = attrs[caracteristica];
        if (valor && !isNaN(valor)) {
          valores.push({ opcion, valor: parseFloat(valor) });
          if (parseFloat(valor) > mejorValor) {
            mejorValor = parseFloat(valor);
          }
        }
      });
      
      valores.sort((a, b) => b.valor - a.valor);
      
      valores.forEach((item, index) => {
        const optionValue = document.createElement('div');
        optionValue.className = 'option-value';
        if (index === 0) {
          optionValue.classList.add('best');
        }
        
        optionValue.innerHTML = `
          <div class="option-value-name">${item.opcion}</div>
          <div class="option-value-number">${item.valor}</div>
          ${index === 0 ? '<span class="best-indicator">Mejor opción</span>' : ''}
        `;
        
        optionsDiv.appendChild(optionValue);
      });
      
      comparisonDiv.appendChild(optionsDiv);
      detailsContainer.appendChild(comparisonDiv);
    }
