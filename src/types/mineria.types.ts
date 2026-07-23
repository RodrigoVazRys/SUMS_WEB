// ─── Types: Minería (Subcomponentes B/C) ──────────────────────────────────────
// Contratos del microservicio Python de minería de datos (FastAPI, puerto 8001).
// Subcomponente B → predicción de riesgo familiar (/riesgo/*).
// Subcomponente C → búsqueda semántica de notas (/buscar*).
// Ver: sums-data-mining/integracion/api_mineria.py

// ─────────────────────────────────────────────────────────────────────────────
// ─── Subcomponente B — Predicción de Riesgo ───────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export type CocinaUbicacion = 'fuera_del_dormitorio' | 'dentro_del_dormitorio'

/** Body de POST /riesgo/predecir. Todos los campos tienen default en el backend. */
export interface FamiliaFeatures {
  numero_cuartos: number
  numero_habitantes: number
  personas_por_cuarto: number
  count_enfermedades_cronicas: number
  count_toxicomanias: number
  avg_dias_proteina: number
  avg_dias_frutas_verduras: number
  avg_dias_cereales: number
  ingreso_nivel: number
  escolaridad_promedio: number
  total_integrantes: number
  material_techo: string
  material_paredes: string
  material_piso: string
  manejo_excretas: string
  cocina_ubicacion: CocinaUbicacion
  agua_entubada: boolean
  energia_electrica: boolean
  cocina_con_lena: boolean
  red_alcantarillado: boolean
  fosa_septica: boolean
  vacunacion_completa: boolean
  seguridad_social_jefe: boolean
  // ── Banderas de grupos vulnerables (grupos_vulnerables.py) ────────────────
  // NO son features del modelo ML -- describen la composición de la familia
  // (embarazada/bebé/menor sin vacunas/adulto mayor solo), información que el
  // modelo (entrenado sobre agregados) no puede ver por sí solo. Se combinan
  // con el nivel de riesgo ML en `prioridad_visita`.
  tiene_embarazada: boolean
  tiene_menor_1_anio: boolean
  tiene_menor_5_sin_vacunas: boolean
  tiene_adulto_mayor_solo: boolean
  tiene_mascota_sin_vacunar: boolean
}

export type NivelRiesgo = 'ALTO' | 'MEDIO' | 'BAJO'
export type PrioridadVisita = 'URGENTE' | 'REGULAR'

/** Respuesta de POST /riesgo/predecir. */
export interface RiesgoPrediccion {
  modelo: string
  nivel_riesgo: NivelRiesgo
  probabilidad_alto: number
  /** "URGENTE" si nivel_riesgo=ALTO O cualquier bandera de grupo vulnerable está activa. */
  prioridad_visita: PrioridadVisita
  /** Explicación legible: qué disparó la prioridad (ej. "integrante embarazada"). */
  motivo_prioridad: string
}

/**
 * Ítem de GET /riesgo/lista. Algunas columnas pueden faltar según los datos
 * disponibles — el consumidor NO debe asumir que todas están presentes y debe
 * renderizar dinámicamente a partir de las keys del primer elemento.
 */
export interface VisitaPrioritaria {
  prioridad: number
  nombre_informante?: string
  domicilio?: string
  colonia?: string
  localidad?: string
  riesgo_predicho: string
  probabilidad_alto: number
  score_total?: number
  [key: string]: string | number | undefined
}

export interface ModeloMetrica {
  Accuracy: number
  F1_Macro: number
  CV_F1_Macro_Media: number
  CV_F1_Macro_Std: number
}

/** Respuesta de GET /riesgo/metricas. */
export interface RiesgoMetricas {
  ganador: string
  modelos: Record<string, ModeloMetrica>
}

export type NivelAlertaZona = 'ALTO' | 'MEDIO' | 'BAJO'

/**
 * Ítem de GET /riesgo/zonas — "riesgo de cúmulo geográfico" agregado por colonia.
 * `nivel_alerta_zona` es un percentil relativo dentro del dataset (no un umbral
 * fijo). Es un proxy honesto por concentración geográfica, NO un modelo de
 * contagio persona-a-persona (hoy no existe un campo de enfermedad transmisible
 * en el modelo de datos).
 */
export interface ResumenZona {
  zona: string
  total_familias: number
  n_alto: number
  pct_alto: number
  n_con_bandera: number
  pct_con_bandera: number
  pct_alto_o_bandera: number
  nivel_alerta_zona: NivelAlertaZona
}

/**
 * Respuesta de GET /riesgo/distribucion — conteo de riesgo (BAJO/MEDIO/ALTO)
 * sobre TODA la población, a diferencia de `/riesgo/lista` (solo las ALTO).
 */
export interface DistribucionRiesgo {
  n_total: number
  distribucion: Record<NivelRiesgo, number>
  n_alto: number
}

/** Respuesta de GET /catalogos — poblar los <select> del formulario de riesgo. */
export interface CatalogosRiesgo {
  materiales_techo: string[]
  materiales_paredes: string[]
  materiales_piso: string[]
  manejo_excretas: string[]
  [key: string]: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Subcomponente A — OCR ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Ver: sums-data-mining/integracion/api_mineria.py (POST /ocr/procesar-cedula) y
// subcomponente_A_OCR/config/field_map_sums.json (IDs de campo, ej.
// "familia.nombre_informante", "vivienda.material_techo.concreto").

export type TipoCampoOcr = 'checkbox' | 'text' | 'number' | 'catalog'

export interface CampoOcr {
  type: TipoCampoOcr
  value: string | number | boolean | null
  confidence: number
  needs_review: boolean
  roi?: string
}

/** Respuesta de POST /ocr/procesar-cedula. `campos` está indexado por el ID de
 * campo del field_map (ej. "familia.nombre_informante"). */
export interface RespuestaOcrCedula {
  doc_id: string
  archivo_original: string
  n_paginas: number
  campos: Record<string, CampoOcr>
  resumen: {
    total_campos: number
    necesitan_revision: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Subcomponente C — Búsqueda Semántica de Notas ────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export type MotorBusqueda = 'bm25' | 'tfidf' | 'semantico'

export interface ResultadoBusqueda {
  posicion: number
  id: string
  titulo: string
  score: number
  texto: string
}

/** Respuesta de GET /buscar. */
export interface RespuestaBusqueda {
  consulta: string
  motor: string
  k: number
  resultados: ResultadoBusqueda[]
}

export interface MetricaBusquedaMotor {
  'P@5': number
  'R@5': number
  MRR: number
  MAP: number
  'nDCG@5': number
}

/** Respuesta de GET /buscar/metricas. `semantico` es opcional (motor no siempre disponible). */
export interface BuscarMetricas {
  tfidf: MetricaBusquedaMotor
  bm25: MetricaBusquedaMotor
  semantico?: MetricaBusquedaMotor
  ganador: string
  criterio: string
  n_queries_evaluados: number
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Subcomponente C — Búsqueda ESTRUCTURADA de cédulas ───────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Complementa a /buscar (notas de texto libre, a menudo escasas): filtra por
// datos que SIEMPRE existen en la cédula -- vacunas, embarazo, nutrición,
// mascotas, colonia/calle. Ver subcomponente_C_busqueda/src/buscador_estructurado.py.

export type CategoriaFiltroEstructurado =
  | 'vacuna' | 'enfermedad_cronica' | 'embarazo' | 'menor_1_anio'
  | 'adulto_mayor' | 'nutricion' | 'mascotas' | 'direccion'

export interface ResultadoBusquedaEstructurada {
  familia_id: number
  nombre_informante: string | null
  domicilio: string
  colonia: string | null
  localidad: string | null
  /** Explicación legible de por qué esta familia coincidió (ej. "con registro de BCG"). */
  coincidencia: string
}

/** Respuesta de GET /buscar/estructurado. disponible=false si la consulta no
 * coincidió con ninguna categoría soportada (ver `mensaje` para sugerencias). */
export interface RespuestaBusquedaEstructurada {
  disponible: boolean
  categoria: CategoriaFiltroEstructurado | null
  negado?: boolean
  total_coincidencias?: number
  mensaje?: string
  resultados: ResultadoBusquedaEstructurada[]
}
