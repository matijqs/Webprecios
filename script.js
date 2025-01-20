document.getElementById('themeSwitcher').addEventListener('change', function() {
    // Cambiar el tema según el estado del interruptor
    if (this.checked) {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    }
});

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
    // Asegurarnos de que la medida se trate como texto
    medida = medida.toString().trim();

    // Si la medida tiene 7 caracteres, convertirla a formato "XXX/XXRXX" y añadir variantes
    if (medida.length === 7) {
        const ancho = medida.substring(0, 3);        // Primeros 3 caracteres
        const perfil = medida.substring(3, 5);       // Caracteres del 3 al 5 (2 dígitos)
        const diametro = medida.substring(5);        // Últimos 2 caracteres

        return [
            `${ancho}/${perfil}R${diametro}`,           // Formato estándar
            `${ancho}/${perfil}ZR${diametro}`,          // Variante ZR
            `${ancho}/${perfil}ZRZ${diametro}`,         // Variante ZRZ
            `${ancho}/${perfil}RZR${diametro}`,         // Variante RZR
            `${ancho}/${perfil}R${diametro}C`,          // Variante con C
            `${ancho}/${perfil}ZR${diametro}C`,         // Variante ZR con C
            `${ancho}/${perfil}ZRF${diametro}`,         // Variante ZRF
            `${ancho}/${perfil}ZRXL${diametro}`,        // Variante ZRXL
            `${ancho}/${perfil}ZRF${diametro}C`         // Variante ZRF con C
        ];
    }

    // Si la medida tiene 5 caracteres, convertirla a formato "XXXRXX" y añadir variantes
    if (medida.length === 5) {
        const ancho = medida.substring(0, 3);        // Primeros 3 caracteres
        const diametro = medida.substring(3);        // Últimos 2 caracteres

        return [
            `${ancho}R${diametro}`,                    // Formato estándar
            `${ancho}R${diametro}C`,                   // Variante con C
            `${ancho}ZR${diametro}`,                   // Variante ZR
            `${ancho}ZR${diametro}C`,                  // Variante ZR con C
            `${ancho}ZRF${diametro}`                   // Variante ZRF
        ];
    }

    // Si la medida ya contiene "/", "R" o "Z", devolverla directamente
    if (medida.includes("/") || medida.includes("R") || medida.includes("Z")) {
        return [medida];
    }

    // Por defecto, devolver la medida como está
    return [medida];
}

document.getElementById('copyButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = 'En la medida solicitada, tenemos lo siguiente:\n\n';

    const alertElements = resultadosDiv.getElementsByClassName('alert');

    for (let i = 0; i < alertElements.length; i++) {
        const alertElement = alertElements[i];
        const lines = alertElement.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
        resultadosTexto += lines.join('\n') + '\n\n';
    }

    resultadosTexto = resultadosTexto.trim();

    navigator.clipboard.writeText(resultadosTexto);
});
