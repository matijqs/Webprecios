document.getElementById('searchButton').addEventListener('click', realizarBusqueda);
document.getElementById('medidaInput').addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
        realizarBusqueda();
    }
});

function realizarBusqueda() {
    const medidaBuscada = document.getElementById('medidaInput').value.trim();
    if (!medidaBuscada) {
        alert("Por favor, ingresa una medida válida.");
        return;
    }
    cargarArchivo(medidaBuscada);
}

function cargarArchivo(medidaBuscada) {
    fetch('files/LISTA GENERAL SAMCOR.xlsx')
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets["Hoja1"];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const variantes = GenerarVariantesMedida(medidaBuscada);

            const resultados = jsonData.filter(row =>
                variantes.some(vari => row["MEDIDA"] && row["MEDIDA"].toString().toUpperCase().includes(vari.toUpperCase()))
            );

            mostrarResultados(resultados, medidaBuscada);
        })
        .catch(error => console.error('Error al cargar el archivo:', error));
}

function GenerarVariantesMedida(medida) {
    medida = medida.toString().trim();
    if (medida.length === 7) {
        const ancho = medida.substring(0, 3);
        const perfil = medida.substring(3, 5);
        const diametro = medida.substring(5);
        return [
            `${ancho}/${perfil}R${diametro}`, `${ancho}/${perfil}ZR${diametro}`, 
            `${ancho}/${perfil}ZRZ${diametro}`, `${ancho}/${perfil}RZR${diametro}`,
            `${ancho}/${perfil}R${diametro}C`, `${ancho}/${perfil}ZR${diametro}C`,
            `${ancho}/${perfil}ZRF${diametro}`, `${ancho}/${perfil}ZRXL${diametro}`,
            `${ancho}/${perfil}ZRF${diametro}C`
        ];
    }
    if (medida.length === 5) {
        const ancho = medida.substring(0, 3);
        const diametro = medida.substring(3);
        return [
            `${ancho}R${diametro}`, `${ancho}R${diametro}C`,
            `${ancho}ZR${diametro}`, `${ancho}ZR${diametro}C`,
            `${ancho}ZRF${diametro}`
        ];
    }
    if (medida.includes("/") || medida.includes("R") || medida.includes("Z")) {
        return [medida];
    }
    return [medida];
}

function mostrarResultados(resultados, medidaBuscada) {
    const resultadosDiv = document.getElementById('resultados');
    resultadosDiv.innerHTML = '';

    const encabezado = document.createElement('h3');
    encabezado.textContent = "Tenemos lo siguiente:";
    resultadosDiv.appendChild(encabezado);

    if (resultados.length > 0) {
        resultados.forEach(fila => {
            const medida = fila["MEDIDA"] || '';
            const marca = fila["MARCA"] || '';
            const modelo = fila["MODELO"] || '';
            const precioUnidad = fila["UNIDAD"] || '';
            const precioJuego = fila["X 4"] || '';

            function formatearPrecio(precio) {
                if (!precio) return '';
                return precio.toLocaleString('es-ES');
            }

            const precioUnidadFormateado = formatearPrecio(precioUnidad);
            const precioJuegoFormateado = formatearPrecio(precioJuego);

            let resultadoTexto = '';

            if (precioJuego && precioUnidad) {
                resultadoTexto = `
                    Medida: ${medida}<br>
                    Marca: ${marca}<br>
                    Modelo: ${modelo}<br>
                    Precio unidad: $${precioUnidadFormateado}<br>
                    Precio por juego: $${precioJuegoFormateado}`;
                if (precioJuego < precioUnidad * 2)
                    resultadoTexto = `
                    Medida: ${medida}<br>
                    Marca: ${marca}<br>
                    Modelo: ${modelo}<br>
                    Precio unidad: $${precioUnidadFormateado}<br>
                    Precio por el par: $${precioJuegoFormateado}`;
            } else if (precioJuego) {
                resultadoTexto = `
                    Medida: ${medida}<br>
                    Marca: ${marca}<br>
                    Modelo: ${modelo}<br>
                    Precio unidad: NO se vende por unidad<br>
                    Precio por juego: $${precioJuegoFormateado}`;
            } else if (precioUnidad) {
                resultadoTexto = `
                    Medida: ${medida}<br>
                    Marca: ${marca}<br>
                    Modelo: ${modelo}<br>
                    Precio unidad: $${precioUnidadFormateado}<br>
                    Precio por juego: NO se hace precio por juego`;
            }

            const resultadoElemento = document.createElement('div');
            resultadoElemento.classList.add('alert', 'alert-info');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('resultado-checkbox');
            checkbox.style.marginRight = '10px';

            resultadoElemento.appendChild(checkbox);
            resultadoElemento.innerHTML += resultadoTexto;
            resultadosDiv.appendChild(resultadoElemento);
        });

        document.getElementById('copyButton').style.display = 'block';
        document.getElementById('copySelectedButton').style.display = 'block';
    } else {
        const resultadoElemento = document.createElement('p');
        resultadoElemento.classList.add('alert', 'alert-warning');
        resultadoElemento.textContent = `No se encontraron neumáticos que contengan la medida "${medidaBuscada}".`;
        resultadosDiv.appendChild(resultadoElemento);

        document.getElementById('copyButton').style.display = 'none';
        document.getElementById('copySelectedButton').style.display = 'none';
    }
}

// Función para copiar todos los resultados
document.getElementById('copyButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';

    resultadosDiv.querySelectorAll('.alert').forEach(alert => {
        const lines = alert.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
        resultadosTexto += lines.join('\n') + '\n\n';
    });

    navigator.clipboard.writeText(resultadosTexto.trim());
});

// Función para copiar solo los resultados seleccionados
document.getElementById('copySelectedButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';

    const checkboxes = resultadosDiv.querySelectorAll('.resultado-checkbox:checked');

    if (checkboxes.length === 0) {
        alert("Selecciona al menos un resultado para copiar.");
        return;
    }

    checkboxes.forEach(checkbox => {
        const resultadoElemento = checkbox.closest('.alert');
        if (resultadoElemento) {
            const lines = resultadoElemento.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
            resultadosTexto += lines.join('\n') + '\n\n';
        }
    });

    resultadosTexto = resultadosTexto.trim();
    navigator.clipboard.writeText(resultadosTexto);
});
