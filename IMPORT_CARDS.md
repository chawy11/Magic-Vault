# Importar Listas de Cartas / Card List Import

Magic Vault ahora soporta la importación masiva de listas de cartas desde otras plataformas como Moxfield, Manabox, o archivos CSV.

## Cómo usar / How to use

1. Ve a tu perfil / Go to your profile
2. Selecciona la pestaña "Wants" o "Sells" según donde quieras añadir las cartas / Select "Wants" or "Sells" tab
3. Haz clic en el botón "Importar lista de cartas" / Click "Import card list" button
4. Pega tu lista de cartas en el cuadro de texto / Paste your card list in the text area
5. Haz clic en "Importar" / Click "Import"

## Formatos Soportados / Supported Formats

### Formato Moxfield
```
1x Lightning Bolt (LEA)
4 Black Lotus
2x Counterspell (ICE)
```

### Formato Manabox
```
1 Lightning Bolt
4 Black Lotus
2 Counterspell
```

### Formato CSV con encabezados / CSV with headers
```
Quantity,Name,Set,Foil
1,Lightning Bolt,LEA,false
4,Black Lotus,LEA,true
2,Counterspell,ICE,false
```

### Formato CSV sin encabezados / CSV without headers
```
1,Lightning Bolt,LEA,false
4,Black Lotus,LEA,true
2,Counterspell,ICE,false
```

### Texto plano / Plain text
```
Lightning Bolt
Black Lotus
Counterspell
```

## Características / Features

- ✅ Detecta automáticamente el formato / Automatically detects format
- ✅ Busca las cartas en Scryfall / Searches cards in Scryfall
- ✅ Soporta códigos de edición / Supports set codes
- ✅ Soporta cartas foil / Supports foil cards
- ✅ Evita duplicados / Prevents duplicates
- ✅ Muestra progreso de importación / Shows import progress
- ✅ Informa de cartas no encontradas / Reports cards not found

## Notas / Notes

- Las cartas que ya existen en tu lista no se duplicarán / Cards that already exist won't be duplicated
- Si especificas un código de edición, se intentará encontrar esa edición específica / If you specify a set code, it will try to find that specific edition
- Las cartas que no se encuentren en Scryfall se omitirán / Cards not found in Scryfall will be skipped
- Hay un pequeño delay entre búsquedas para evitar límites de tasa de la API / There's a small delay between searches to avoid API rate limits

## Ejemplos de importación desde otras plataformas / Import examples from other platforms

### Desde Moxfield
1. Ve a tu deck en Moxfield
2. Haz clic en "Export"
3. Copia el texto en formato "Arena" o "Text"
4. Pégalo en Magic Vault

### Desde Manabox
1. Ve a tu colección en Manabox
2. Selecciona "Export"
3. Elige formato "CSV" o "Text"
4. Pega el contenido en Magic Vault

### Desde Archidekt
1. Ve a tu deck
2. Haz clic en "Export"
3. Selecciona formato de texto
4. Copia y pega en Magic Vault
