// Agregar un evento para el botón
document.getElementById('searchButton').addEventListener('click', realizarBusqueda);

// Agregar el evento de la tecla Enter
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

            const resultadosDiv = document.getElementById('resultados');
            resultadosDiv.innerHTML = '';

            const encabezado = document.createElement('h3');
            encabezado.textContent = "En la medida solicitada, tenemos lo siguiente:";
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
                    resultadoElemento.innerHTML = resultadoTexto;
                    resultadosDiv.appendChild(resultadoElemento);
                });

                document.getElementById('copyButton').style.display = 'block';
            } else {
                const resultadoElemento = document.createElement('p');
                resultadoElemento.classList.add('alert', 'alert-warning');
                resultadoElemento.textContent = `No se encontraron neumáticos que contengan la medida "${medidaBuscada}".`;
                resultadosDiv.appendChild(resultadoElemento);

                document.getElementById('copyButton').style.display = 'none';
            }
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
            `${ancho}/${perfil}R${diametro}`, `${ancho}/${perfil}ZR${diametro}`, `${ancho}/${perfil}RZR${diametro}`, `${ancho}/${perfil}R${diametro}C`
        ];
    }
    if (medida.length === 5) {
        const ancho = medida.substring(0, 3);
        const diametro = medida.substring(3);
        return [`${ancho}R${diametro}`, `${ancho}ZR${diametro}`];
    }
    return [medida];
}

// Evento para copiar el contenido de los resultados
document.getElementById('copyButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = 'En la medida solicitada, tenemos lo siguiente:\n\n';

    // Obtener todos los elementos de alerta dentro del contenedor de resultados
    const alertElements = resultadosDiv.getElementsByClassName('alert');

    // Recorrer cada elemento de alerta y formatear el texto
    for (let i = 0; i < alertElements.length; i++) {
        const alertElement = alertElements[i];
        const lines = alertElement.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
        resultadosTexto += lines.join('\n') + '\n\n';
    }

    // Limpiar los resultados para evitar espacios extra entre líneas
    resultadosTexto = resultadosTexto.trim(); // Eliminar espacios adicionales al principio y al final

    navigator.clipboard.writeText(resultadosTexto);
});
