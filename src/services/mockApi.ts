export const getMockDataForUrl = (url: string): any => {
  if (url.includes('/estadisticas/resumen-general')) {
    return {
      total_cedulas: 4069,
      cedulas_hoy: 125,
      total_personas: 17651,
      total_viviendas: 5400,
      total_nucleos: 4100,
      total_dosis: 8500,
      total_entrevistadores: 34,
      cedulas_mes: 3100
    }
  }
  if (url.includes('/estadisticas/productividad/entrevistadores')) {
    return [
      { id_entrevistador: 1, nombre: 'Ana García', alta: '2023-01', total: 450, hoy: 15, semana: 45, mes: 120, ultima_actividad: '2023-11-01' },
      { id_entrevistador: 2, nombre: 'Juan Pérez', alta: '2023-02', total: 380, hoy: 12, semana: 38, mes: 95, ultima_actividad: '2023-11-01' },
      { id_entrevistador: 3, nombre: 'María López', alta: '2023-03', total: 310, hoy: 10, semana: 31, mes: 80, ultima_actividad: '2023-10-31' },
    ]
  }
  if (url.includes('/estadisticas/cedulas/serie')) {
    return [
      { periodo: '2023-05', total: 120 }, { periodo: '2023-06', total: 340 },
      { periodo: '2023-07', total: 560 }, { periodo: '2023-08', total: 420 },
      { periodo: '2023-09', total: 890 }, { periodo: '2023-10', total: 1120 },
    ]
  }
  if (url.includes('/estadisticas/cedulas/por-estado')) {
    return [
      { estado: 'borrador', total: 240 },
      { estado: 'sincronizada', total: 850 },
      { estado: 'validada', total: 2979 }
    ]
  }
  if (url.includes('/estadisticas/cedulas/por-unidad')) {
    return [
      { id_unidad_salud: 1, nombre: 'Centro de Salud A', total: 1250 },
      { id_unidad_salud: 2, nombre: 'Hospital General', total: 980 },
      { id_unidad_salud: 3, nombre: 'Clínica B', total: 640 },
    ]
  }
  if (url.includes('/estadisticas/cedulas/por-localidad')) {
    return [
      { localidad: 'Centro', total: 850 },
      { localidad: 'Norte', total: 620 },
      { localidad: 'Sur', total: 430 },
    ]
  }
  if (url.includes('/estadisticas/cedulas/por-colonia')) {
    return [
      { colonia: 'Las Palmas', total: 420 },
      { colonia: 'San José', total: 310 },
    ]
  }
  if (url.includes('/estadisticas/cedulas/nucleos-tamano')) {
    return [
      { tamano: 1, total: 120 }, { tamano: 2, total: 350 },
      { tamano: 3, total: 890 }, { tamano: 4, total: 1200 },
      { tamano: 5, total: 650 }, { tamano: 6, total: 210 },
    ]
  }
  if (url.includes('/estadisticas/demografia/piramide')) {
    return [
      { rango_edad: '0-4', sexo: 'masculino', total: 850 }, { rango_edad: '0-4', sexo: 'femenino', total: 820 },
      { rango_edad: '5-14', sexo: 'masculino', total: 1540 }, { rango_edad: '5-14', sexo: 'femenino', total: 1490 },
      { rango_edad: '15-29', sexo: 'masculino', total: 2100 }, { rango_edad: '15-29', sexo: 'femenino', total: 2250 },
      { rango_edad: '30-44', sexo: 'masculino', total: 1980 }, { rango_edad: '30-44', sexo: 'femenino', total: 2150 },
      { rango_edad: '45-59', sexo: 'masculino', total: 1200 }, { rango_edad: '45-59', sexo: 'femenino', total: 1350 },
      { rango_edad: '60+', sexo: 'masculino', total: 850 }, { rango_edad: '60+', sexo: 'femenino', total: 980 },
    ]
  }
  if (url.includes('/estadisticas/demografia/genero')) {
    return [
      { sexo: 'masculino', total: 8520 },
      { sexo: 'femenino', total: 9040 },
    ]
  }
  if (url.includes('/estadisticas/demografia/escolaridad')) {
    return [
      { nombre: 'Primaria', total: 5670 }, { nombre: 'Secundaria', total: 4070 },
      { nombre: 'Bachillerato', total: 2088 }, { nombre: 'Licenciatura', total: 1084 },
    ]
  }
  if (url.includes('/estadisticas/demografia/alfabetizacion')) {
    return {
      alfabetizados: 16086,
      no_alfabetizados: 1565,
      sin_dato: 0
    }
  }
  if (url.includes('/estadisticas/demografia/lengua-indigena')) {
    return [
      { lengua: 'Español', total: 13799 },
      { lengua: 'Lengua Indígena', total: 3848 },
    ]
  }
  if (url.includes('/estadisticas/demografia/ingreso')) {
    return [
      { rango: '< $3,000', total: 2450 }, { rango: '$3,000 - $6,000', total: 5680 },
      { rango: '$6,000 - $10,000', total: 3120 }, { rango: '> $10,000', total: 950 },
    ]
  }
  if (url.includes('/estadisticas/demografia/ocupacion')) {
    return [
      { nombre: 'Hogar', total: 4500 }, { nombre: 'Estudiante', total: 3800 },
      { nombre: 'Empleado', total: 3200 }, { nombre: 'Comerciante', total: 1500 },
    ]
  }
  if (url.includes('/estadisticas/demografia/estado-civil')) {
    return [
      { nombre: 'Soltero(a)', total: 6540 },
      { nombre: 'Casado(a)', total: 7210 },
      { nombre: 'Unión Libre', total: 2850 },
    ]
  }
  if (url.includes('/estadisticas/salud/enfermedades-cronicas')) {
    return [
      { nombre: 'Hipertensión', personas: 2152 },
      { nombre: 'Diabetes', personas: 1691 },
      { nombre: 'Obesidad', personas: 854 },
    ]
  }
  if (url.includes('/estadisticas/salud/toxicomanias')) {
    return [
      { nombre: 'Tabaquismo', personas: 2015 },
      { nombre: 'Alcoholismo', personas: 1450 },
    ]
  }
  if (url.includes('/estadisticas/salud/discapacidad')) {
    return {
      resumen: { con_discapacidad: 1250, sin_discapacidad: 16401 },
      por_tipo: [
        { tipo: 'Motriz', total: 450 }, { tipo: 'Visual', total: 320 },
      ]
    }
  }
  if (url.includes('/estadisticas/salud/preventiva')) {
    return {
      resumen: {
        tamizaje_cervico_uterino: 4500,
        tamizaje_cancer_mama: 2100,
        con_atencion_embarazo: 850,
        total_registros: 14500
      },
      por_atencion_embarazo: [
        { nombre: 'Prenatal', total: 500 }, { nombre: 'Postparto', total: 350 }
      ]
    }
  }
  if (url.includes('/estadisticas/salud/seguridad-social')) {
    return {
      con_seguridad: 6616,
      sin_seguridad: 11035
    }
  }
  if (url.includes('/estadisticas/salud/alimentacion')) {
    return {
      promedio_dias_proteina: 4.2,
      promedio_dias_frutas_verduras: 2.8,
      promedio_dias_cereales: 5.1,
      total_registros: 17651
    }
  }
  if (url.includes('/estadisticas/salud/servicios-salud')) {
    return [
      { nombre: 'Centro de Salud', total: 8540 },
      { nombre: 'Consultorio Farmacia', total: 4210 },
      { nombre: 'Hospital Público', total: 1250 },
    ]
  }
  if (url.includes('/estadisticas/salud/higiene-bucodental')) {
    return {
      diaria: 14881,
      no_diaria: 2770,
      sin_dato: 0,
      total: 17651
    }
  }
  if (url.includes('/estadisticas/salud/piramide-vacuna')) {
    return [
      { rango_edad: '0-4', sexo: 'masculino', total: 400 },
      { rango_edad: '0-4', sexo: 'femenino', total: 420 },
      { rango_edad: '5-14', sexo: 'masculino', total: 1100 },
      { rango_edad: '5-14', sexo: 'femenino', total: 1050 }
    ]
  }
  if (url.includes('/estadisticas/vivienda/servicios')) {
    return {
      total_viviendas: 5400,
      con_agua: 4200, sin_agua: 1200,
      con_luz: 4500, sin_luz: 900,
      con_alcantarillado: 3800, sin_alcantarillado: 1600,
      con_fosa_septica: 800
    }
  }
  if (url.includes('/estadisticas/vivienda/hacinamiento')) {
    return {
      viviendas_hacinadas: 1200,
      viviendas_no_hacinadas: 4200,
      sin_dato: 0,
      promedio_personas_por_cuarto: 2.4
    }
  }
  if (url.includes('/estadisticas/vivienda/materiales-riesgo')) {
    return {
      piso_tierra: 850,
      cocina_con_lena: 1400,
      cocina_en_dormitorio: 320,
      total_viviendas: 5400
    }
  }
  if (url.includes('/estadisticas/vivienda/animales')) {
    return {
      por_animal: [
        { nombre: 'Perros', total: 2400 },
        { nombre: 'Gatos', total: 1200 },
        { nombre: 'Aves', total: 800 }
      ],
      mascotas: {
        con_perros_gatos_dentro: 1500,
        mascotas_sin_vacunar: 850,
        mascotas_esterilizadas: 1100
      }
    }
  }
  if (url.includes('/vacunaciones/por-sexo')) {
    const isM = url.includes('/M')
    return [
      { sexo: isM ? 'M' : 'F', vacuna: 'BCG', total_aplicaciones: isM ? 400 : 420 },
      { sexo: isM ? 'M' : 'F', vacuna: 'Hepatitis B', total_aplicaciones: isM ? 350 : 370 },
      { sexo: isM ? 'M' : 'F', vacuna: 'Hexavalente', total_aplicaciones: isM ? 300 : 310 },
      { sexo: isM ? 'M' : 'F', vacuna: 'Rotavirus', total_aplicaciones: isM ? 280 : 290 },
      { sexo: isM ? 'M' : 'F', vacuna: 'Neumocócica', total_aplicaciones: isM ? 200 : 210 },
    ]
  }
  if (url.includes('/vacunaciones/por-rango-edad')) {
    return [
      { vacuna: 'BCG', rango_0_4: 450, rango_5_14: 120, rango_15_29: 0, rango_30_44: 0, rango_45_59: 0, rango_60_mas: 0 },
      { vacuna: 'Hepatitis B', rango_0_4: 650, rango_5_14: 320, rango_15_29: 100, rango_30_44: 50, rango_45_59: 10, rango_60_mas: 0 },
    ]
  }
  
  return null
}
