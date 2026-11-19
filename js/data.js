/* =========================================================
   Radar Global de Emergencias — datos de demostración
   IMPORTANTE: estos eventos son FICTICIOS. Reemplázalos por
   datos reales (por ejemplo, de la API de ReliefWeb o GDACS).
   x / y = posición en el mapa (viewBox 0 0 1800 900)
   ========================================================= */

/* Íconos: Font Awesome 6 Free (clase "fa-solid fa-...") */
const TYPES = {
  terremoto:  { name: "Terremoto",          icon: "fa-house-crack" },
  inundacion: { name: "Inundación",         icon: "fa-house-flood-water" },
  huracan:    { name: "Huracán",            icon: "fa-hurricane" },
  incendio:   { name: "Incendio forestal",  icon: "fa-fire" },
  crisis:     { name: "Crisis humanitaria", icon: "fa-people-group" }
};

const LEVELS = {
  alto:  { name: "Alto",  color: "#e10600" },
  medio: { name: "Medio", color: "#ff7a00" },
  bajo:  { name: "Bajo",  color: "#f2c200" }
};

/* Íconos de necesidades */
const NEEDS = {
  alimentos:  { name: "Alimentos",     icon: "fa-bread-slice" },
  agua:       { name: "Agua potable",  icon: "fa-droplet" },
  refugio:    { name: "Refugio",       icon: "fa-tent" },
  medicinas:  { name: "Medicinas",     icon: "fa-pills" },
  higiene:    { name: "Higiene",       icon: "fa-pump-soap" },
  energia:    { name: "Energía",       icon: "fa-bolt" },
  mascarillas:{ name: "Mascarillas",   icon: "fa-head-side-mask" }
};

const EMERGENCIES = [
  {
    id: 1, type: "terremoto", level: "alto",
    country: "Japón", region: "Asia Oriental · Pacífico",
    date: "12 de abril de 2025", fact: "Magnitud 6.8",
    x: 1480, y: 305,
    status: "Daños en varias ciudades costeras; continúan la evaluación y las labores de rescate.",
    needs: ["alimentos", "agua", "refugio", "medicinas"],
    context: "Japón está sobre el Cinturón de Fuego del Pacífico, una de las zonas con mayor actividad sísmica del planeta, y gran parte de su población vive en la costa.",
    history: [["2011", "Terremoto y tsunami de Tōhoku"], ["1995", "Terremoto de Kobe"], ["1923", "Gran terremoto de Kantō"]],
    help: "https://www.jrc.or.jp/english/"
  },
  {
    id: 2, type: "inundacion", level: "medio",
    country: "Brasil", region: "Sudamérica",
    date: "11 de abril de 2025", fact: "120.000 personas afectadas",
    x: 510, y: 610,
    status: "Ríos desbordados; miles de familias permanecen en albergues temporales.",
    needs: ["agua", "refugio", "alimentos", "higiene"],
    context: "Sus grandes cuencas fluviales y las lluvias intensas hacen que las crecidas sean recurrentes en el sur y el norte del país.",
    history: [["2024", "Inundaciones en Rio Grande do Sul"], ["2011", "Deslizamientos en la región serrana de Río"]],
    help: "https://www.icrc.org/es"
  },
  {
    id: 7, type: "inundacion", level: "alto",
    country: "Colombia", region: "Sudamérica · Andes",
    date: "13 de abril de 2025", fact: "35.000 familias afectadas",
    x: 417, y: 500,
    status: "Lluvias intensas causan desbordamientos y deslizamientos en varios departamentos; hay vías cerradas y albergues habilitados.",
    needs: ["agua", "refugio", "alimentos", "higiene"],
    context: "Las tres cordilleras andinas, sus laderas inestables y los grandes ríos como el Magdalena y el Cauca hacen que las temporadas de lluvia provoquen inundaciones y deslizamientos con frecuencia.",
    history: [["2017", "Avenida torrencial de Mocoa"], ["2010–11", "Ola invernal del fenómeno de La Niña"], ["1985", "Tragedia de Armero"]],
    help: "https://www.cruzrojacolombiana.org"
  },
  {
    id: 3, type: "huracan", level: "alto",
    country: "Caribe", region: "Caribe · Atlántico",
    date: "10 de abril de 2025", fact: "Vientos de 200 km/h",
    x: 415, y: 415,
    status: "Huracán de categoría 4 en trayectoria sobre varias islas.",
    needs: ["refugio", "alimentos", "energia", "medicinas"],
    context: "Cada temporada de huracanes del Atlántico golpea islas de baja elevación con infraestructura vulnerable.",
    history: [["2017", "Huracanes Irma y María"], ["2004", "Huracán Iván"]],
    help: "https://www.unocha.org"
  },
  {
    id: 5, type: "crisis", level: "alto",
    country: "Sudán", region: "África Oriental",
    date: "8 de abril de 2025", fact: "Millones de desplazados",
    x: 1030, y: 375,
    status: "Conflicto prolongado con escasez de alimentos y de atención médica.",
    needs: ["alimentos", "medicinas", "agua", "refugio"],
    context: "Región con conflictos recurrentes, sequías y una alta dependencia de la ayuda internacional.",
    history: [["2023", "Inicio del conflicto actual"], ["2003", "Crisis de Darfur"]],
    help: "https://www.acnur.org"
  },
  {
    id: 6, type: "incendio", level: "bajo",
    country: "Australia", region: "Oceanía",
    date: "6 de abril de 2025", fact: "8.000 hectáreas afectadas",
    x: 1465, y: 695,
    status: "Focos parcialmente controlados por brigadas locales.",
    needs: ["agua", "mascarillas"],
    context: "El clima seco y la vegetación inflamable hacen frecuentes los incendios durante el verano austral.",
    history: [["2019–20", "Temporada del «Verano Negro»"]],
    help: "https://www.redcross.org.au"
  }
];

const ORGANIZATIONS = [
  { name: "ONU · OCHA", icon: "fa-globe", text: "Coordina la respuesta humanitaria internacional.", url: "https://www.unocha.org" },
  { name: "Cruz Roja (CICR)", icon: "fa-kit-medical", text: "Asistencia médica, refugio y apoyo a la población.", url: "https://www.icrc.org/es" },
  { name: "ACNUR", icon: "fa-person-shelter", text: "Protección y asistencia a personas desplazadas.", url: "https://www.acnur.org" },
  { name: "UNICEF", icon: "fa-child-reaching", text: "Ayuda para niñas, niños y familias en emergencias.", url: "https://www.unicef.org/es" },
  { name: "Programa Mundial de Alimentos", icon: "fa-wheat-awn", text: "Asistencia alimentaria en crisis y desastres.", url: "https://es.wfp.org" },
  { name: "ReliefWeb", icon: "fa-satellite-dish", text: "Informes y datos actualizados sobre crisis en el mundo.", url: "https://reliefweb.int" }
];
