# PDR – Weather & Traffic Risk Alerts

## 1. Visión
Construir una app global (foco US + LATAM) centrada en **alertas inteligentes de riesgo** que combine **clima + tráfico + señales comunitarias**, ayudando a las personas a **decidir mejor cuándo y cómo moverse**, sin competir directamente con apps de navegación.

La app no optimiza rutas: **optimiza decisiones**.

---

## 2. Problema
- Las apps de clima son pasivas y genéricas.
- Las apps de tráfico (ej. Waze) optimizan rutas, pero no evalúan riesgo climático.
- Los usuarios quieren saber:
  - *¿Es seguro salir ahora?*
  - *¿Conviene salir antes o después?*
  - *¿Hay eventos reales ocurriendo ahora mismo?*

---

## 3. Propuesta de Valor

### Core diferencial
Un **Risk Score dinámico** que combina:
- Datos meteorológicos
- Datos de tráfico
- Eventos reportados y confirmados por la comunidad

Output principal:
- Alertas accionables
- Recomendación de horario de salida
- Señales claras (riesgo bajo / medio / alto)

---

## 4. Features Principales

### 4.1 Sistema Unificado de Eventos (Core)

**Event**
- id
- type:
  - Weather: tormenta, granizo, viento, niebla, inundación
  - Traffic: accidente, congestión, corte, obra, baja visibilidad
- location (point / polyline / polygon)
- severity (1–5)
- source:
  - Automático (proveedores)
  - Usuario
- confidenceScore (0–100)
- TTL dinámico

---

### 4.2 Confirmación Comunitaria (inspirado en Waze)

Usuarios pueden confirmar eventos activos:
- ✅ Sigue ocurriendo
- 🟢 Ya se despejó
- ❌ No existe

Reglas:
- Sin texto libre
- Sin perfiles públicos
- Sin chat

Cada confirmación:
- Ajusta confidenceScore
- Ajusta TTL
- Impacta el Risk Score

---

### 4.3 Risk Score (Feature Clave)

Cálculo dinámico por zona / ruta habitual:

Inputs:
- Severidad climática
- Intensidad de tráfico
- Eventos confirmados
- Historial de confiabilidad

Outputs:
- Score 0–100
- Clasificación: Bajo / Medio / Alto

Usado por:
- Alertas
- Widgets
- Horario de salida
- CarPlay

---

### 4.4 Alertas Inteligentes

Tipos:
- Clima severo cercano
- Tráfico crítico en ruta habitual
- Combinación clima + tráfico (alto valor)

Ejemplos:
- “🚨 Tráfico detenido + tormenta fuerte en tu salida habitual”
- “⚠️ Visibilidad baja confirmada por otros conductores”

---

### 4.5 Horario de Salida Recomendado

La app aprende:
- Horarios habituales
- Rutas frecuentes

Cruza con:
- Risk Score futuro

Output:
- “⏰ Hoy conviene salir a las 8:05”
- “Si salís después de las 8:30, el riesgo aumenta 32%”

---

### 4.6 Widgets

Widgets glanceables:
- Estado de riesgo actual
- Alertas activas
- Tráfico en ruta habitual

---

### 4.7 CarPlay (Futuro)

- Alertas pasivas
- Confirmación con 1 toque o voz
- Sin navegación

---

## 5. Lo que NO es la app

- ❌ Navegación turn-by-turn
- ❌ Chat social
- ❌ Red social de conductores

---

## 6. Monetización

### Free
- Alertas básicas
- Eventos automáticos

### Pro (Suscripción)
- Alertas anticipadas
- Horario de salida inteligente
- Risk Score avanzado
- Widgets Pro
- CarPlay (cuando aplique)

---

## 7. Métricas Clave

- Activaciones de alertas
- Confirmaciones por evento
- Retención 7 / 30 días
- Conversión a Pro

---

## 8. Ventaja Competitiva

- Cruce real clima + tráfico
- Señales comunitarias sin fricción
- Enfoque en riesgo y decisión, no navegación
- Escalable a B2B (flotas, seguros)

---

## 9. MVP Alcance

IN:
- Eventos clima
- Eventos tráfico
- Confirmación comunitaria
- Risk Score v1
- Alertas push

OUT:
- Navegación
- Chat
- Gamificación

---

## 10. Visión a Futuro

- API de Risk Score
- Integración con seguros
- Alertas colaborativas en catástrofes
- Herramienta de comunicación de emergencia

