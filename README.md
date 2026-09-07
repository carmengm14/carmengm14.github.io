# LABEL LAB — Generador de etiquetas v3

## Cambios de esta versión

- Formatos: 80×18 mm, 70×40 mm y 48,5×25,4 mm.
- Las portadas son imágenes en `assets/portadas/`.
- Logo común cargable.
- Logo editable:
  - X / Y
  - ancho / alto
  - arrastrar directamente sobre la etiqueta
  - redimensionar desde la esquina inferior derecha
- Tipografías de Google Fonts.
- Carga de TTF, OTF, WOFF y WOFF2.
- Ajustes independientes por cada texto:
  - tamaño
  - peso
  - alineación
  - altura de línea
- Un PDF por cada fila del CSV.
- Nombre: PRODUCTO - COLOR - TAMAÑO - DETALLES.pdf

## Portadas

Sustituye estos archivos por tus imágenes:

- `assets/portadas/80x18.jpg`
- `assets/portadas/70x40.jpg`
- `assets/portadas/48-5x25-4.jpg`

## CSV

Columnas recomendadas:

`logo,producto,color,tamano,detalles,qr`

En esta fase `logo` y `qr` admiten URL o data URL. El logo común se puede cargar directamente desde el panel.

## Ejecutar

Recomendado con VS Code + Live Server. También puedes usar:

`python3 -m http.server 8000`

y abrir `http://localhost:8000`.

Las posiciones actuales de los elementos son provisionales. El siguiente paso es convertir cada formato en una plantilla fiel a los diseños reales.


## Comportamiento de campos vacíos

Si una fila del CSV no tiene `detalles`, `color`, `tamano` o cualquier otro campo opcional, ese elemento no se dibuja en la etiqueta. Se mantiene el espacio de la composición, pero nunca aparece el nombre del campo como texto de ejemplo.


## Exportación v6
La exportación rasteriza previamente las imágenes dentro del mismo contenedor y dimensiones de la vista previa para evitar recortes de logos/SVG y diferencias entre editor y PDF. El logo se gestiona mediante un contenedor independiente para que el tirador de redimensionado no interfiera con la exportación.

## Plantilla 70 × 40 mm con QR
La plantilla 70 × 40 mm coloca el QR a la izquierda y el logo/contenido a la derecha. El QR se genera desde la columna `qr` del CSV y se puede mover y redimensionar desde el editor.


### QR transparente y editable
- La columna `qr` contiene la URL de destino.
- El QR se genera automáticamente como SVG transparente.
- El color del QR se puede elegir desde el panel.
- El tamaño y la posición se pueden editar visualmente y mediante X/Y/Tamaño.
- En la plantilla 70×40 mm, el logo queda arriba y el nombre del producto empieza debajo para evitar solapamientos.


## Editor visual v10
- Todos los campos de texto (producto, color, tamano y detalles) se pueden seleccionar y arrastrar directamente sobre la etiqueta.
- X e Y del texto también se pueden ajustar numéricamente.
- Se incorporan reglas en milímetros y guías verticales/horizontales.
- Las guías se pueden mostrar/ocultar, arrastrar, eliminar individualmente con doble clic o mediante el botón, y borrar todas.
- Las guías y controles de edición no se exportan al PDF.
- El área de vista previa permanece fija mientras se desplaza la configuración; el panel de configuración tiene su propio scroll.
