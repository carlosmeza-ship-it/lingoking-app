export type Stage = 'pending' | 'rev' | 'transl' | 'deficit' | 'done'

export interface LogEntry {
  date: string
  note: string
  source?: 'doc' | 'email' | 'manual'
}

export interface Candidate {
  id: string
  name: string
  aktenzeichen?: string
  deadline?: string
  rev: string
  envio: string
  transl: string
  deficit: string
  factura: string
  comments?: string
  log: LogEntry[]
  createdAt: string
  updatedAt: string
}

export function getStage(c: Candidate): Stage {
  if (c.deficit === 'Defizit Ok') return 'done'
  if (c.deficit === 'Defizit solicitado') return 'deficit'
  if (c.transl === 'Traducción Terminada') return 'transl'
  if (c.envio === 'Recibido') return 'transl'
  if (c.rev !== 'Pendiente') return 'rev'
  return 'pending'
}

export const STAGE_LABELS: Record<Stage, string> = {
  pending: 'Pendiente',
  rev: 'Revisión',
  transl: 'Traducción',
  deficit: 'Déficit',
  done: 'Cerrado',
}

export const DOC_DATA: Array<{ name: string; aktenzeichen: string; deadline: string; log: LogEntry[] }> = [
  { name: 'Alejandra Leva Vallejo', aktenzeichen: '55.3--2421.ZAABY_1-2036', deadline: '10.07.2026', log: [{ date: '03.06.', note: 'El segundo juego fue enviado a Manuel por Verena por correo postal. Número de seguimiento: JJD14.05 844 578 988.', source: 'doc' }, { date: '29.05.', note: 'Defizitbescheid recibido. Falta: CV, Antecedentes actualizados, Good Standing actualizado, Diploma. Tiene hasta el 10.07. Se le informó a Nomii.', source: 'doc' }, { date: '18.05.', note: 'Se decidió que la traducción se envíe a la dirección de Manuel para copia certificada en el notario.', source: 'doc' }, { date: '06.03.', note: 'Germán autorizó el envío. Se hizo la solicitud de Defizit Bescheid.', source: 'doc' }, { date: '08.12.25', note: 'Enviados a traducir. Posteriormente faltaron Scans de calidad ilegible.', source: 'doc' }] },
  { name: 'Alina María Cervantes Real', aktenzeichen: '55.3-2421.ZAABY_1-1386', deadline: '22.05.26', log: [{ date: '09.06.', note: 'Documentos innecesarios enviados. Manuel los envió al Sachgebiet equivocado.', source: 'doc' }, { date: '06.05.', note: 'Se le informó a Frau Buchner y se pidió confirmación de recepción.', source: 'doc' }, { date: '21.04.', note: 'Frau Buchner dio prórroga hasta el 22 de mayo.', source: 'doc' }, { date: '19.02.', note: 'Noticia de Oberbayern: falta CV con formato correcto y permiso para ejercer medicina. Hasta el 26 de marzo.', source: 'doc' }] },
  { name: 'Andrea Corpeño López', aktenzeichen: '55.3--2421.ZAABY_1-2028', deadline: '08.07.26', log: [{ date: '21.05.', note: 'DB recibido. Falta: Good Standing, Traducción de antecedentes, Diploma, Notas, Prácticas, Servicio social. Se informó a Nomii.', source: 'doc' }, { date: '06.03.', note: 'Solicitud de Defizit Bescheid enviada.', source: 'doc' }, { date: '26.02.', note: 'Documentos recibidos en Berlín.', source: 'doc' }] },
  { name: 'Ángel Martín Alarcón Macías', aktenzeichen: '55.3-2421 ZAABY_1-1461', deadline: '', log: [{ date: '03.06.', note: 'La solicitud fue rechazada. Se informó a lingoking y a Nomii.', source: 'doc' }, { date: '16.12.25', note: 'Solicitud de Defizitbescheid enviada.', source: 'doc' }, { date: '11.11.25', note: 'Documentos recibidos en Berlín.', source: 'doc' }] },
  { name: 'Angie Paulette Arauz Saltos', aktenzeichen: '', deadline: '', log: [{ date: '09.06.', note: 'Revisión de documentos físicos. Falta casi todo. Etapa muy temprana. Necesita B2, cursando B1.', source: 'doc' }] },
  { name: 'Antonio José Estrada Hoyo', aktenzeichen: '', deadline: '', log: [{ date: '26.01.', note: 'Revisión carpeta digital: falta copia certificada en Certificado de título, Constancia de internado, Good Standing, Inscripción y Solvencia, Partida de Nacimiento y pasaporte.', source: 'doc' }] },
  { name: 'Astrid Mariam Enamorado Ortega', aktenzeichen: '', deadline: '', log: [{ date: '11.11.25', note: 'Revisión de carpeta digital. Necesitan copias certificadas. Faltan: CV, Cédula profesional, Comprobantes de empleo, Good Standing, Antecedentes, Pasaporte.', source: 'doc' }] },
  { name: 'Catalina Andrea Ochoa Urrutia', aktenzeichen: '55.3-2421.ZAABY_1-1207', deadline: '30.05.26', log: [{ date: '03.06.', note: 'Documentos enviados a Gotzinger Strasse 23 con retraso. Se solicitó extensión a Buchner. Buchner de vacaciones hasta el 08.06.', source: 'doc' }, { date: '11.05.', note: 'Frau Buchner: Good Standing sigue sin estar actualizado. Nueva fecha límite: 30 de mayo.', source: 'doc' }, { date: '08.04.', note: 'Traducciones restantes enviadas a Buchner.', source: 'doc' }] },
  { name: 'Daniel Bryan Müller Quintanilla', aktenzeichen: '', deadline: '', log: [{ date: '07.04.', note: 'Subió nuevos documentos pero el CV está mal. Duda: ¿Niedersachsen o Bayern? Se informó a Germán.', source: 'doc' }] },
  { name: 'Daniela Harbst Tassara', aktenzeichen: '55.3--2421.ZAABY_1-1703', deadline: '30.06.', log: [{ date: '09.06.', note: 'Se le pidió a Germán nuevo scan del diploma.', source: 'doc' }, { date: '08.06.', note: 'Germán compartió documentos faltantes. Enviados a traducir. Falta Good Standing.', source: 'doc' }, { date: '15.05.', note: 'Defizitbescheid: requieren Good Standing actualizado y Diploma. Fecha límite 30 de junio.', source: 'doc' }, { date: '23.12.25', note: 'Documentos recibidos en Berlín.', source: 'doc' }] },
  { name: 'David Enrique Díaz Mejía', aktenzeichen: '', deadline: '', log: [{ date: '08.06.', note: 'Manuel avisó que David ya no seguirá en el programa de NOMII.', source: 'doc' }] },
  { name: 'David Hernández Viveros', aktenzeichen: '', deadline: '', log: [{ date: '09.06.', note: 'Se informó a Manuel que la solicitud sigue atorada por falta de documentos.', source: 'doc' }, { date: '10.03.', note: 'Traducciones en Berlín. Falta Vollmacht y CV. No se puede hacer la solicitud.', source: 'doc' }] },
  { name: 'Dinorah Gómez Castellanos', aktenzeichen: '55.3-2421 ZAABY_1-806', deadline: '28.01.', log: [{ date: '11.12.25', note: 'Documentos faltantes informados a Germán: CV, copias certificadas de Pasaporte, Antecedentes, Good Standing, Diploma, Internado, Servicio Social, Cédula.', source: 'doc' }] },
  { name: 'Ellen Cristina Gerónimo Bonilla', aktenzeichen: '', deadline: '', log: [{ date: '09.06.', note: 'Solicitud del Defizitbescheid hecha el 13.05. Juliana entregó personalmente en Oberbayern.', source: 'doc' }, { date: '30.04.', note: 'Solicitud digital hecha.', source: 'doc' }, { date: '08.04.', note: 'Traducciones terminadas.', source: 'doc' }] },
  { name: 'Fernanda Ximena Castro Ibáñez', aktenzeichen: '', deadline: '', log: [{ date: '09.06.', note: 'Traducción extra del Servicio Rural. Todo en orden. No necesita estar en Berlín. Se informó a Manuel.', source: 'doc' }, { date: '31.03.', note: 'Defizitbescheid solicitado. Error: sin número de envío.', source: 'doc' }] },
  { name: 'Gabriela Kimberlyn Moran Caiza', aktenzeichen: '', deadline: '', log: [{ date: '08.06.', note: 'Oberbayern informó que Gabriela es fisioterapeuta, no doctora. Hay que volver a hacer la aplicación.', source: 'doc' }] },
  { name: 'Ian Job Lino Durán', aktenzeichen: '', deadline: '', log: [{ date: '20.04.', note: 'Frau Buchner: CV tiene huecos. Solicita CV correcto hasta el 20 de mayo.', source: 'doc' }] },
  { name: 'Jonathan Christian Cardenas Peña', aktenzeichen: '55.3--2421.ZAABY_1-2035', deadline: '08.07.26', log: [{ date: '21.05.', note: 'DB recibido. Falta: Examen de Habilitación para el Ejercicio (copia certificada y traducción). Se informó a Nomii.', source: 'doc' }, { date: '06.03.', note: 'Solicitud de Defizitbescheid enviada.', source: 'doc' }, { date: '16.01.', note: 'Documentos recibidos en Berlín.', source: 'doc' }] },
  { name: 'Jorge Augusto Cámbara Vargas', aktenzeichen: '55.3--2421.ZAABY_1-1820', deadline: '25.06.', log: [{ date: '09.06.', note: 'Se recordó a Manuel de documentos faltantes. Se solicitó prórroga de dos meses a Buchner.', source: 'doc' }, { date: '07.05.', note: 'Defizitbescheid: falta Vollmacht, CV, Pasaporte (traducción), Malla curricular, Comprobante de Externado.', source: 'doc' }, { date: '09.02.', note: 'Solicitud del Defizitbescheid enviada.', source: 'doc' }] },
  { name: 'José Marcelo Marroquín Guzmán', aktenzeichen: '55.3--2421.ZAABY_1-2033', deadline: '08.07.26', log: [{ date: '01.06.', note: 'DB recibido. Falta: Good Standing, Traducción de antecedentes, Diploma, Licencia médica, Notas, Horas, Prácticas, Servicio social. Se informó a Nomii.', source: 'doc' }, { date: '06.03.', note: 'Defizitbescheid solicitado.', source: 'doc' }] },
  { name: 'Juan Pablo Martínez Cabello', aktenzeichen: '55.3-2421.ZAABY_1-805', deadline: '10.03.', log: [{ date: '09.02.', note: 'Segundo envío.', source: 'doc' }, { date: '21.01.', note: 'Frau Buchner otorgó prórroga para documentos faltantes hasta el 10.03.', source: 'doc' }] },
  { name: 'Julián Medina', aktenzeichen: '', deadline: '29.05.', log: [{ date: '03.06.', note: 'Segundo juego enviado a Manuel por Verena por correo postal.', source: 'doc' }, { date: '19.05.', note: 'Documentos recibidos en lingoking. Enviados a Oberbayern a tiempo.', source: 'doc' }, { date: '17.04.', note: 'Oberbayern pide hasta 29 de mayo: CV correcto, Good Standing actualizado, Examen de Habilitación para el Ejercicio.', source: 'doc' }] },
  { name: 'Laura Margarita Cepeda Garrido', aktenzeichen: '', deadline: '', log: [{ date: '15.10.25', note: 'Comentarios de Carlos: faltan Constancias de Trabajo, Documento probatorio para Hessen, Certificado médico, Vollmacht.', source: 'doc' }] },
  { name: 'Lina María Estrada Duque', aktenzeichen: '55.3-2421.Hb_1A-14043', deadline: '30.04.26', log: [{ date: '06.05.', note: 'Se informó a Frau Buchner y se pidió confirmación de recepción.', source: 'doc' }, { date: '05.05.', note: 'Documentos enviados a dirección incorrecta. Recibidos por Christian Pfaus.', source: 'doc' }, { date: '18.03.', note: 'Frau Buchner extendió la fecha límite hasta el 30.04.', source: 'doc' }] },
  { name: 'Manuel Sulbaran', aktenzeichen: '55.3-2421.ZAABY_1-1392', deadline: '', log: [{ date: '08.06.', note: 'Germán envió documentos atrasados para traducción. Falta el certificado del servicio social.', source: 'doc' }, { date: '29.01.', note: 'Primer Defizitbescheid de Oberbayern. Requieren antecedentes, good standing y servicio social. Fecha límite 19.03. No los entregó → rechazo el 20.05.', source: 'doc' }] },
  { name: 'María Ángeles Gutiérrez Quevedo', aktenzeichen: '', deadline: '22.05.26', log: [{ date: '05.05.', note: 'Documentos rebotaron: enviados al Sachgebiet equivocado. Juliana los enviará nuevamente.', source: 'doc' }, { date: '21.04.', note: 'Frau Buchner dio prórroga hasta el 22 de mayo por teléfono.', source: 'doc' }] },
  { name: 'Marco Tulio Negrete Aceves', aktenzeichen: '55.3-2421.ZAABY_1-807', deadline: '28.01.', log: [{ date: '16.03.', note: 'Prórroga solicitada, sin respuesta.', source: 'doc' }, { date: '16.01.', note: 'Documentos faltantes enviados.', source: 'doc' }] },
  { name: 'María Fernanda Paz Alvar Sepúlveda', aktenzeichen: '', deadline: '', log: [{ date: '09.06.', note: 'Se informó a Manuel del estado actual.', source: 'doc' }, { date: '31.03.', note: 'Revisión física: falta Vollmacht, CV incorrecto, Good Standing del 19 de noviembre, Antecedentes del 28 de enero, Horas cursadas.', source: 'doc' }] },
  { name: 'Mauricio Alcayaga', aktenzeichen: '', deadline: '', log: [{ date: '03.06.', note: 'Verena envió traducciones a la dirección de Manuel por correo postal.', source: 'doc' }, { date: '02.06.', note: 'JF con Nomii: pedirán junta con Mauricio para aclarar la situación.', source: 'doc' }, { date: '11.05.', note: 'Enviados a traducir.', source: 'doc' }] },
  { name: 'Mayra Leonor Rivera Paico', aktenzeichen: '', deadline: '', log: [{ date: '10.04.', note: 'Primera respuesta de Niedersachsen: falta ZSBA y certificado B2. Sin fecha límite.', source: 'doc' }, { date: '31.03.', note: 'Traducciones recibidas en Berlín. Defizitbescheid solicitado. Error: sin número de envío.', source: 'doc' }] },
  { name: 'Rodrigo Alfonso Busse Hernández', aktenzeichen: '', deadline: '30.04.', log: [{ date: '24.04.', note: 'Respuesta Buchner: documentos recibidos. Faltan aún Führungszeugnis y Attest.', source: 'doc' }, { date: '08.04.', note: 'Traducciones faltantes enviadas.', source: 'doc' }] },
  { name: 'Valeria Carolina Heredia Peña', aktenzeichen: '', deadline: '30.04.', log: [{ date: '16.04.', note: 'Nueva fecha límite de Frau Buchner: 30.04.', source: 'doc' }, { date: '08.04.', note: 'Traducciones restantes enviadas a Buchner.', source: 'doc' }] },
  { name: 'Virna Nathaly Montenegro Samaniego', aktenzeichen: '', deadline: '', log: [{ date: '09.06.', note: 'Traducción extra en Berlín de múltiples documentos. No se ha hecho solicitud del Defizitbescheid. Faltan documentos.', source: 'doc' }, { date: '09.03.', note: 'Revisión digital. Faltan CV y Vollmacht. Servicio pausado por falta de pagos. Resuelto el 25 de marzo.', source: 'doc' }] },
]

export function findDocData(name: string) {
  if (!name) return null
  const n = name.toLowerCase().trim()
  return DOC_DATA.find(d => {
    const dn = d.name.toLowerCase().trim()
    if (dn === n) return true
    const parts = dn.split(' ')
    return parts.length >= 2 && n.includes(parts[0]) && n.includes(parts[parts.length - 1])
  }) || null
}
