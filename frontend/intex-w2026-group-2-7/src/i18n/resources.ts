export const resources = {
  en: {
    common: {
      brand: {
        name: "Hope Shelter",
        logoAlt: "Hope Shelter logo",
      },
      nav: {
        home: "Home",
        getHelp: "Get Help",
        impact: "Impact",
        dashboard: "Dashboard",
        donate: "Donate",
        openMenu: "Open navigation menu",
        closeMenu: "Close navigation menu",
        darkMode: "Switch to dark mode",
        lightMode: "Switch to light mode",
        signIn: "Sign In",
        signOut: "Sign Out",
        myDonations: "My Donations",
      },
      language: {
        label: "Language",
        options: {
          en: "English",
          es: "Español",
        },
      },
      quickExit: "Quick Exit",
      preferences: {
        button: "Preferences",
        title: "Preferences",
        description: "Manage appearance and language settings for the admin workspace.",
        appearance: "Appearance",
        light: "Light",
        dark: "Dark",
        save: "Save",
        cancel: "Cancel",
      },
      footer: {
        description:
          "Providing safety, hope, and healing for at-risk girls in the Dominican Republic.",
        quickLinks: "Quick Links",
        contact: "Contact",
        staffLogin: "Staff Login",
        privacyPolicy: "Privacy Policy",
        location: "Santo Domingo, Dominican Republic",
        donateNow: "Donate Now",
        rights: "All rights reserved.",
      },
      cookieConsent: {
        title: "Cookie Notice",
        description:
          "We only use necessary cookies to keep this site secure and functioning properly. These cookies cannot be disabled. Review our <privacyLink>Privacy Policy</privacyLink> for more details.",
        acknowledge: "Acknowledge",
      },
    },
    home: {
      hero: {
        titlePrefix: "A Safe Harbor of",
        titleAccent: "Hope",
        description:
          "Providing safety, healing, and brighter futures for at-risk girls in the Dominican Republic.",
        primaryAction: "Get Help",
        secondaryAction: "Donate",
        heroAlt: "Peaceful Caribbean beach with palm trees",
      },
      mission: {
        title: "Our Mission",
        paragraph1:
          "Hope Shelter provides staff and board members with a secure, centralized platform to manage girls' progress and donor relationships, while offering at-risk girls in the Dominican Republic trusted access to safety resources and support.",
        paragraph2:
          "We believe every girl deserves safety, love, and the chance to thrive. Through dedicated case management, community partnerships, and generous donor support, we create pathways from vulnerability to empowerment.",
        imageAlt: "Safe house for girls",
      },
      stats: {
        childrenHelped: "Girls Helped",
        yearsOfService: "Years of Service",
        activeDonors: "Active Donors",
        staffAndVolunteers: "Operating Safe Houses",
      },
      services: {
        title: "How We Help",
        safeShelter: {
          title: "Safe Shelter",
          description:
            "A secure, loving environment where girls can heal and grow, free from harm.",
        },
        caseManagement: {
          title: "Case Management",
          description:
            "Professional tracking of each girl's progress, education, and well-being through our secure platform.",
        },
        donorSupport: {
          title: "Donor Support",
          description:
            "Transparent donor relationships that ensure resources reach those who need them most.",
        },
      },
    },
    getHelp: {
      emergency: {
        prefix: "If you are in immediate danger, call",
        connector: "or",
      },
      safetyNotice: {
        emphasis: "Your safety matters.",
        beforeQuickExit: "Use the",
        afterQuickExit:
          "button at any time to leave this page instantly. Consider using a private/incognito browser window.",
      },
      hero: {
        title: "You Are Not Alone",
        description:
          "Whether you need immediate help or want to learn about resources available to you, we're here for you. Everything shared with us is confidential.",
      },
      form: {
        title: "Reach Out to Us",
        subtitle: "All fields are optional. Share only what you feel comfortable with.",
        nameLabel: "Name (optional)",
        namePlaceholder: "You can use a nickname",
        ageLabel: "Age",
        agePlaceholder: "Your age",
        locationLabel: "Location",
        locationPlaceholder: "City or area",
        contactMethodLabel: "How can we safely contact you?",
        contactMethodPlaceholder: "Phone, email, or other safe method",
        messageLabel: "Your Message",
        messagePlaceholder: "Tell us how we can help you...",
        submit: "Send Message",
      },
      toast: {
        title: "Message Sent",
        description: "Your message has been received. Someone will reach out to you safely.",
      },
      directContact: {
        title: "Contact Us Directly",
        hotlineLabel: "Hope Shelter Hotline",
        visitUs: "Visit Us",
        location: "Santo Domingo, Dominican Republic",
      },
      resources: {
        title: "Resource Directory",
        nationalChildAbuseHotline: {
          name: "National Child Abuse Hotline",
          type: "Hotline",
        },
        conani: {
          name: "CONANI (DR Child Welfare)",
          type: "Government",
        },
        womensShelter: {
          name: "Local Women's Shelter",
          type: "Shelter",
        },
        legalAid: {
          name: "Legal Aid Society - DR",
          type: "Legal",
        },
      },
    },
    dashboard: {
      common: {
        noData: "No data",
        noDate: "No date",
        noPeriod: "No period",
      },
      sidebar: {
        dashboard: "Dashboard",
        residents: "Residents",
        donations: "Donations",
        caseConferences: "Case Conferences",
        safehouses: "Safehouses",
        reports: "Reports",
        settings: "Settings",
      },
      actions: {
        tryAgain: "Try again",
      },
      error: {
        title: "Dashboard data is unavailable",
        description: "The operational overview could not be loaded right now.",
      },
      header: {
        kicker: "Dashboard",
        title: "Admin Dashboard",
        description: "Resident capacity, donation activity, conference scheduling, and care progress.",
        reportingMonth: "Reporting Month",
        lastRefreshed: "Last Refreshed",
      },
      metrics: {
        activeResidents: {
          title: "Active residents",
          detail_one: "{{count}} safehouse online",
          detail_other: "{{count}} safehouses online",
        },
        availableBeds: {
          title: "Available beds",
          detail: "{{count}} total capacity",
        },
        recentDonations: {
          title: "Recent donations",
          detail_one: "{{count}} gift in the last 90 days",
          detail_other: "{{count}} gifts in the last 90 days",
        },
        upcomingConferences: {
          title: "Upcoming conferences",
          detailOverdue: "{{count}} need rescheduling",
          detailClear: "Conference calendar is clear",
        },
      },
      progress: {
        title: "Progress snapshot",
        description: "Education and health indicators from the latest completed reporting periods.",
        updatedThrough: "Updated through {{month}}",
        cards: {
          educationProgress: "Education Progress",
          healthScore: "Health Score",
          careActivity: "Care Activity",
          sessions_one: "{{count}} session",
          sessions_other: "{{count}} sessions",
          visits_one: "{{count}} visit",
          visits_other: "{{count}} visits",
          incidents_one: "{{count}} incident",
          incidents_other: "{{count}} incidents",
        },
        chart: {
          educationProgress: "Education progress",
          healthScore: "Health score",
        },
      },
      safehouses: {
        title: "Safehouse occupancy",
        description: "Live bed availability across all active locations.",
        networkUtilization: "Network Utilization",
        summary: "{{residents}} residents across {{safehouses}} active safehouses.",
        openBeds: "{{count}} open",
      },
      conferences: {
        title: "Case conference calendar",
        descriptionUpcoming: "Next scheduled case conferences requiring staff attention.",
        descriptionOverdue: "No future conferences are scheduled. These plans need a new date.",
        badgeUpcoming: "{{count}} upcoming",
        badgeOverdue: "{{count}} overdue",
        empty: "No case conferences are on the calendar right now.",
        timing: {
          today: "Today",
          inDays: "In {{count}} days",
          overdue: "{{count}} days overdue",
        },
      },
      donations: {
        title: "Recent donations",
        description: "Latest recorded gifts and in-kind support from the last 90 days.",
        totalBadge: "{{count}} total",
        empty: "No recent donations are available for this reporting window.",
        via: "{{type}} via {{channel}}",
      },
    },
    login: {
      title: "Login",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      usernameLabel: "Username",
      usernamePlaceholder: "you@hopeshelter.org",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      newPasswordLabel: "New Password",
      submit: "Login",
      signingIn: "Logging in…",
      registerTitle: "Create an Account",
      confirmPasswordLabel: "Confirm Password",
      confirmPasswordPlaceholder: "••••••••",
      registerSubmit: "Create Account",
      registering: "Creating account…",
      createAccountLink: "Create account",
      backToLoginLink: "Back to login",
      forgotPasswordLink: "Forgot password",
      forgotPasswordTitle: "Forgot Password",
      forgotPasswordSubmit: "Send Reset Code",
      sendingResetCode: "Sending reset code…",
      resetPasswordTitle: "Reset Password",
      resetCodeLabel: "Reset Code",
      resetCodePlaceholder: "12345678",
      resetPasswordSubmit: "Reset Password",
      resettingPassword: "Resetting password…",
      externalSignInLabel: "Or continue with",
      signInWithProvider: "Sign in with {{provider}}",
      externalProviderFallback: "provider",
      externalCallbackPending: "Completing Sign-In",
      externalCallbackWorking: "Finishing sign-in with {{provider}}.",
      externalCallbackErrorTitle: "Sign-In Failed",
      externalCallbackError: "We couldn't complete external sign-in.",
      externalCallbackFailed: "Sign in with {{provider}} could not be completed.",
      externalCallbackMissingCode: "The external sign-in response did not include a code.",
      passwordMismatch: "Passwords do not match.",
      loginFailed: "Sign in failed. Check your username and password.",
      registerFailed: "Registration failed. Please try again.",
      forgotPasswordFailed: "We couldn't send a reset code right now.",
      resetPasswordFailed: "We couldn't reset your password.",
      passwordResetCodeSent: "Check your email for the 8-digit reset code.",
      passwordResetSuccess: "Your password was reset. You can sign in now.",
      resetCodeInvalidLength: "Enter the full 8-digit reset code.",
      nameRequired: "Name is required.",
    },
    notFound: {
      message: "Oops! Page not found",
      returnHome: "Return to Home",
    },
    impact: {
      title: "Our Impact",
      subtitle:
        "This page shares aggregated, anonymized data to clearly show outcomes, progress, and resource use.",
      stats: {
        girlsHelped: "Girls Helped",
        yearsOfService: "Years of Service",
        activeDonors: "Active Donors",
        operatingSafeHouses: "Operating Safe Houses",
      },
      cards: {
        outcomes: {
          title: "Outcomes",
          description:
            "We track everything to understand how many girls are being served and how they are growing.",
        },
        progress: {
          title: "Progress",
          description:
            "Trend-level progress indicators help the team improve care plans, identify needs, and strengthen long-term support.",
        },
        resourceUse: {
          title: "Resource Use",
          description:
            "Donor and operational resources are summarized at a high level for transparency while preserving individual privacy.",
        },
      },
      preview: {
        outcomes: {
          girlsReintegrated: "Girls Reintegrated",
          activeResidents: "Active Residents",
          openCases: "Open Cases",
        },
        progress: {
          schoolAttendance: "School Attendance",
          educationGrowth: "Education Growth (Quarter)",
          processSessionsThisMonth: "Support Sessions This Month",
        },
        resourceUse: {
          programAllocation: "Program Allocation",
          costPerGirl: "Avg Cost per Girl",
          recurringDonors: "Recurring Donor Share",
        },
      },
      pillars: {
        title: "Safety, Healing, and Encouragement",
        safety: {
          title: "Safety",
          description:
            "We prioritize immediate safety planning and stable shelter placement so every girl can begin recovery in a secure environment.",
        },
        healing: {
          title: "Healing",
          description:
            "Girls receive trauma-informed care, case support, and consistent follow-up to strengthen wellbeing and resilience.",
        },
        empowerment: {
          title: "Encouragement",
          description:
            "Education, life-skills coaching, and community integration help girls move from crisis toward long-term independence.",
        },
      },
      campaign: {
        title: "Wheels of Hope",
        description:
          "Transportation is critical to safety, court access, school continuity, and healthcare. Campaign support helps keep girls connected to essential services.",
        cta: "Support the Campaign",
      },
    },
    donate: {
      hero: {
        title: "Support Their Future",
        subtitle: "Every donation is used to help girls find safety, healing, and opportunity.",
        alt: "Donate to support girls",
      },
      form: {
        title: "Make a Donation",
        nameLabel: "Name",
        namePlaceholder: "Your full name",
        emailLabel: "Email",
        emailPlaceholder: "you@example.com",
        amountLabel: "Donation Amount",
        amountPlaceholder: "50.00",
        submit: "Donate",
      },
      cards: {
        why: {
          title: "Why Donations Matter",
          description:
            "Donations fund shelter operations, case support, education services, food, and transportation so girls can continue building safe, stable lives.",
        },
        operations: {
          title: "Keeping Services Running",
          description:
            "It takes ongoing funding every month to keep safe houses, programs, staffing, and daily care fully operational for every girl we serve.",
        },
        gratitude: {
          title: "Thank You",
          description:
            "We are deeply grateful for every gift. Every penny is used to help girls through safety, healing, and long-term support.",
        },
      },
      toast: {
        title: "Thank you for your generosity!",
        description: "Every donation helps girls access safety, healing, and hope.",
      },
    },
    donorPortal: {
      header: {
        welcomeBack: "Welcome back",
        welcomeBackWithName: "Welcome back, {{name}}",
        subtitle: "Thank you for your continued support of Hope Shelter.",
      },
      stats: {
        totalDonated: "Total donated",
        donationsMade: "Donations made",
        yearsSupporting: "Years supporting",
      },
      allocation: {
        title: "Your impact",
        totalAllocated: "Total allocated: {{amount}}",
        noAllocations: "No allocation records yet.",
        supporting: "Supporting: {{list}}",
        table: {
          programArea: "Program area",
          amount: "Amount allocated",
        },
      },
      history: {
        title: "Donation history",
        description: "Donations link automatically to your account email ({{email}}).",
        loading: "Loading your donation history…",
        emptyTitle: "No donations found for this email yet",
        emptyDescription:
          "If you donated using a different email, sign in with that address to see your giving history.",
        makeDonation: "Make a donation",
        via: "{{type}} via {{channel}}",
        toSafehouse: "{{program}}: {{amount}} to {{safehouse}} ({{city}}, {{country}})",
      },
      errors: {
        loadFailed: "Unable to load your donation history right now.",
      },
    },
    caseload: {
      sidebar: {
        dashboard: "Dashboard",
        residents: "Residents",
        donations: "Donations",
        caseConferences: "Case Conferences",
        safehouses: "Safehouses",
        reports: "Reports",
        settings: "Settings",
      },
      header: {
        kicker: "Case Management",
        title: "Residents",
        description: "View, search, filter, and maintain resident case records.",
      },
      common: {
        all: "All",
      },
      filters: {
        search: "Search",
        searchPlaceholder: "Name/code, worker, category, safehouse",
        caseStatus: "Case Status",
        safehouse: "Safehouse",
        caseCategory: "Case Category",
        socialWorker: "Social Worker",
      },
      list: {
        residentCount_one: "{{count}} resident",
        residentCount_other: "{{count}} residents",
        perPage: "Per page",
      },
      cards: {
        unnamedResident: "Unnamed resident",
        socialWorker: "Social worker",
        unassigned: "Unassigned",
        noStatus: "No status",
        dobNotSet: "DOB not set",
        noCategory: "No category",
        noSubcategories: "No sub-categories",
      },
      pagination: {
        previous: "Previous",
        next: "Next",
        pageOf: "Page {{page}} of {{total}}",
      },
      dialogs: {
        profileTitle: "Resident profile",
        createTitle: "Create resident",
      },
      actions: {
        addResident: "Add resident",
        edit: "Edit",
        cancelEdit: "Cancel edit",
        save: "Save",
        cancel: "Cancel",
      },
      fields: {
        residentCode: "Resident name/code",
        internalCode: "Internal code",
        firstName: "First Name",
        lastName: "Last Name",
        caseControlNo: "Case Control No.",
        caseStatus: "Case Status",
        caseCategory: "Case Category",
        caseCategoryPlaceholder: "Select a category",
        safehouse: "Safehouse",
        assignedSocialWorker: "Assigned Social Worker",
        dateOfBirth: "Date of Birth",
        dateOfAdmission: "Date of Admission",
        referralSource: "Referral Source",
        reintegrationStatus: "Reintegration Status",
        pwdType: "PWD Type",
        specialNeedsDiagnosis: "Special Needs Diagnosis",
        restrictedNotes: "Restricted Notes",
      },
      sections: {
        caseSubcategories: "Case sub-categories",
        familyProfile: "Family socio-demographic profile",
      },
      subCategories: {
        subCatOrphaned: "Orphaned",
        subCatTrafficked: "Trafficked",
        subCatChildLabor: "Child Labor",
        subCatPhysicalAbuse: "Physical Abuse",
        subCatSexualAbuse: "Sexual Abuse",
        subCatOsaec: "OSAEC",
        subCatCicl: "CICL",
        subCatAtRisk: "At Risk",
        subCatStreetChild: "Street Child",
        subCatChildWithHiv: "Child With HIV",
      },
      familyProfile: {
        familyIs4Ps: "4Ps Beneficiary",
        familySoloParent: "Solo Parent",
        familyIndigenous: "Indigenous Group",
        familyParentPwd: "Parent with Disability",
        familyInformalSettler: "Informal Settler",
      },
      errors: {
        loadFailed: "Could not load caseload data.",
        saveFailed: "Could not save resident changes.",
      },
    },
  },
  es: {
    common: {
      brand: {
        name: "Refugio de Esperanza",
        logoAlt: "Logotipo de Refugio de Esperanza",
      },
      nav: {
        home: "Inicio",
        getHelp: "Obtener ayuda",
        impact: "Impacto",
        dashboard: "Panel",
        donate: "Donar",
        openMenu: "Abrir menú de navegación",
        closeMenu: "Cerrar menú de navegación",
        darkMode: "Cambiar a modo oscuro",
        lightMode: "Cambiar a modo claro",
        signIn: "Iniciar sesión",
        signOut: "Cerrar sesión",
        myDonations: "Mis donaciones",
      },
      language: {
        label: "Idioma",
        options: {
          en: "English",
          es: "Español",
        },
      },
      quickExit: "Salida rápida",
      preferences: {
        button: "Preferencias",
        title: "Preferencias",
        description: "Administra la apariencia y el idioma del espacio administrativo.",
        appearance: "Apariencia",
        light: "Claro",
        dark: "Oscuro",
        save: "Guardar",
        cancel: "Cancelar",
      },
      footer: {
        description:
          "Brindamos seguridad, esperanza y sanación a niñas en riesgo en la República Dominicana.",
        quickLinks: "Enlaces rápidos",
        contact: "Contacto",
        staffLogin: "Ingreso del personal",
        privacyPolicy: "Política de privacidad",
        location: "Santo Domingo, República Dominicana",
        donateNow: "Donar ahora",
        rights: "Todos los derechos reservados.",
      },
      cookieConsent: {
        title: "Aviso de cookies",
        description:
          "Solo usamos cookies necesarias para mantener este sitio seguro y funcionando correctamente. Estas cookies no se pueden desactivar. Consulta nuestra <privacyLink>Política de privacidad</privacyLink> para obtener más información.",
        acknowledge: "Entendido",
      },
    },
    home: {
      hero: {
        titlePrefix: "Un puerto seguro de",
        titleAccent: "esperanza",
        description:
          "Brindamos seguridad, sanación y futuros más brillantes para niñas en riesgo en la República Dominicana.",
        primaryAction: "Obtener ayuda",
        secondaryAction: "Donar",
        heroAlt: "Playa tranquila del Caribe con palmeras",
      },
      mission: {
        title: "Nuestra misión",
        paragraph1:
          "Refugio de Esperanza brinda al personal y a los miembros de la junta una plataforma segura y centralizada para gestionar el progreso de las niñas y las relaciones con donantes, mientras ofrece a niñas en riesgo en la República Dominicana acceso confiable a recursos de seguridad y apoyo.",
        paragraph2:
          "Creemos que cada niña merece seguridad, amor y la oportunidad de prosperar. A través de una gestión de casos dedicada, alianzas comunitarias y el generoso apoyo de donantes, creamos caminos que llevan de la vulnerabilidad al empoderamiento.",
        imageAlt: "Casa segura para niñas",
      },
      stats: {
        childrenHelped: "Niñas ayudadas",
        yearsOfService: "Años de servicio",
        activeDonors: "Donantes activos",
        staffAndVolunteers: "Numero de casas seguras",
      },
      services: {
        title: "Cómo ayudamos",
        safeShelter: {
          title: "Refugio seguro",
          description:
            "Un entorno seguro y amoroso donde las niñas pueden sanar y crecer, libres de peligro.",
        },
        caseManagement: {
          title: "Gestión de casos",
          description:
            "Seguimiento profesional del progreso, la educación y el bienestar de cada niña a través de nuestra plataforma segura.",
        },
        donorSupport: {
          title: "Apoyo de donantes",
          description:
            "Relaciones transparentes con donantes que garantizan que los recursos lleguen a quienes más los necesitan.",
        },
      },
    },
    getHelp: {
      emergency: {
        prefix: "Si estás en peligro inmediato, llama al",
        connector: "o al",
      },
      safetyNotice: {
        emphasis: "Tu seguridad importa.",
        beforeQuickExit: "Usa el botón de",
        afterQuickExit:
          "en cualquier momento para salir de esta página al instante. Considera usar una ventana privada o de incógnito.",
      },
      hero: {
        title: "No estás sola",
        description:
          "Ya sea que necesites ayuda inmediata o quieras conocer los recursos disponibles para ti, estamos aquí para apoyarte. Todo lo que compartas con nosotros es confidencial.",
      },
      form: {
        title: "Comunícate con nosotras",
        subtitle:
          "Todos los campos son opcionales. Comparte solo lo que te haga sentir cómoda.",
        nameLabel: "Nombre (opcional)",
        namePlaceholder: "Puedes usar un apodo",
        ageLabel: "Edad",
        agePlaceholder: "Tu edad",
        locationLabel: "Ubicación",
        locationPlaceholder: "Ciudad o zona",
        contactMethodLabel: "¿Cómo podemos contactarte de forma segura?",
        contactMethodPlaceholder: "Teléfono, correo u otro método seguro",
        messageLabel: "Tu mensaje",
        messagePlaceholder: "Cuéntanos cómo podemos ayudarte...",
        submit: "Enviar mensaje",
      },
      toast: {
        title: "Mensaje enviado",
        description:
          "Hemos recibido tu mensaje. Alguien se pondrá en contacto contigo de forma segura.",
      },
      directContact: {
        title: "Contáctanos directamente",
        hotlineLabel: "Línea de ayuda de Refugio de Esperanza",
        visitUs: "Visítanos",
        location: "Santo Domingo, República Dominicana",
      },
      resources: {
        title: "Directorio de recursos",
        nationalChildAbuseHotline: {
          name: "Línea nacional de abuso infantil",
          type: "Línea de ayuda",
        },
        conani: {
          name: "CONANI (bienestar infantil RD)",
          type: "Gobierno",
        },
        womensShelter: {
          name: "Refugio local para mujeres",
          type: "Refugio",
        },
        legalAid: {
          name: "Sociedad de ayuda legal - RD",
          type: "Legal",
        },
      },
    },
    dashboard: {
      common: {
        noData: "Sin datos",
        noDate: "Sin fecha",
        noPeriod: "Sin periodo",
      },
      sidebar: {
        dashboard: "Panel",
        residents: "Residentes",
        donations: "Donaciones",
        caseConferences: "Conferencias de caso",
        safehouses: "Casas seguras",
        reports: "Reportes",
        settings: "Configuracion",
      },
      actions: {
        tryAgain: "Intentar de nuevo",
      },
      error: {
        title: "No hay datos del panel disponibles",
        description: "No se pudo cargar el resumen operativo en este momento.",
      },
      header: {
        kicker: "Panel",
        title: "Panel de administracion",
        description:
          "Capacidad de residentes, actividad de donaciones, programacion de conferencias y progreso del cuidado.",
        reportingMonth: "Mes del informe",
        lastRefreshed: "Ultima actualizacion",
      },
      metrics: {
        activeResidents: {
          title: "Residentes activas",
          detail_one: "{{count}} casa segura activa",
          detail_other: "{{count}} casas seguras activas",
        },
        availableBeds: {
          title: "Camas disponibles",
          detail: "{{count}} capacidad total",
        },
        recentDonations: {
          title: "Donaciones recientes",
          detail_one: "{{count}} donacion en los ultimos 90 dias",
          detail_other: "{{count}} donaciones en los ultimos 90 dias",
        },
        upcomingConferences: {
          title: "Conferencias proximas",
          detailOverdue: "{{count}} requieren reprogramacion",
          detailClear: "El calendario de conferencias esta al dia",
        },
      },
      progress: {
        title: "Resumen de progreso",
        description:
          "Indicadores de educacion y salud de los periodos de reporte completados mas recientes.",
        updatedThrough: "Actualizado hasta {{month}}",
        cards: {
          educationProgress: "Progreso educativo",
          healthScore: "Puntaje de salud",
          careActivity: "Actividad de cuidado",
          sessions_one: "{{count}} sesion",
          sessions_other: "{{count}} sesiones",
          visits_one: "{{count}} visita",
          visits_other: "{{count}} visitas",
          incidents_one: "{{count}} incidente",
          incidents_other: "{{count}} incidentes",
        },
        chart: {
          educationProgress: "Progreso educativo",
          healthScore: "Puntaje de salud",
        },
      },
      safehouses: {
        title: "Ocupacion de casas seguras",
        description: "Disponibilidad de camas en tiempo real en todas las ubicaciones activas.",
        networkUtilization: "Utilizacion de la red",
        summary: "{{residents}} residentes en {{safehouses}} casas seguras activas.",
        openBeds: "{{count}} libres",
      },
      conferences: {
        title: "Calendario de conferencias de caso",
        descriptionUpcoming: "Proximas conferencias de caso que requieren atencion del personal.",
        descriptionOverdue: "No hay conferencias futuras programadas. Estos planes requieren nueva fecha.",
        badgeUpcoming: "{{count}} proximas",
        badgeOverdue: "{{count}} vencidas",
        empty: "No hay conferencias de caso en el calendario en este momento.",
        timing: {
          today: "Hoy",
          inDays: "En {{count}} dias",
          overdue: "{{count}} dias vencida",
        },
      },
      donations: {
        title: "Donaciones recientes",
        description: "Ultimos aportes registrados y apoyo en especie de los ultimos 90 dias.",
        totalBadge: "{{count}} total",
        empty: "No hay donaciones recientes disponibles para este periodo.",
        via: "{{type}} via {{channel}}",
      },
    },
    login: {
      title: "Iniciar sesión",
      nameLabel: "Nombre",
      namePlaceholder: "Tu nombre",
      usernameLabel: "Usuario",
      usernamePlaceholder: "tu@RefugiodeEsperanza.org",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "••••••••",
      newPasswordLabel: "Nueva contraseña",
      submit: "Iniciar sesión",
      signingIn: "Ingresando…",
      registerTitle: "Crear una cuenta",
      confirmPasswordLabel: "Confirmar contraseña",
      confirmPasswordPlaceholder: "••••••••",
      registerSubmit: "Crear cuenta",
      registering: "Creando cuenta…",
      createAccountLink: "Crear cuenta",
      backToLoginLink: "Volver al inicio de sesión",
      forgotPasswordLink: "Olvidé mi contraseña",
      forgotPasswordTitle: "Recuperar contraseña",
      forgotPasswordSubmit: "Enviar código",
      sendingResetCode: "Enviando código…",
      resetPasswordTitle: "Restablecer contraseña",
      resetCodeLabel: "Código de restablecimiento",
      resetCodePlaceholder: "12345678",
      resetPasswordSubmit: "Restablecer contraseña",
      resettingPassword: "Restableciendo contraseña…",
      externalSignInLabel: "O continúa con",
      signInWithProvider: "Iniciar sesión con {{provider}}",
      externalProviderFallback: "proveedor",
      externalCallbackPending: "Completando inicio de sesión",
      externalCallbackWorking: "Finalizando el inicio de sesión con {{provider}}.",
      externalCallbackErrorTitle: "No se pudo iniciar sesión",
      externalCallbackError: "No pudimos completar el inicio de sesión externo.",
      externalCallbackFailed: "No se pudo completar el inicio de sesión con {{provider}}.",
      externalCallbackMissingCode: "La respuesta del proveedor no incluyó un código.",
      passwordMismatch: "Las contraseñas no coinciden.",
      loginFailed: "No se pudo iniciar sesión. Revisa tu usuario y contraseña.",
      registerFailed: "No se pudo crear la cuenta. Inténtalo de nuevo.",
      forgotPasswordFailed: "No pudimos enviar un código de restablecimiento en este momento.",
      resetPasswordFailed: "No pudimos restablecer tu contraseña.",
      passwordResetCodeSent: "Revisa tu correo para ver el código de 8 dígitos.",
      passwordResetSuccess: "Tu contraseña fue restablecida. Ya puedes iniciar sesión.",
      resetCodeInvalidLength: "Ingresa el código completo de 8 dígitos.",
      nameRequired: "El nombre es obligatorio.",
    },
    notFound: {
      message: "Vaya, no se encontró la página",
      returnHome: "Volver al inicio",
    },
    impact: {
      title: "Nuestro Impacto",
      subtitle:
        "Esta pagina comparte datos agregados y anonimizados para mostrar claramente resultados, progreso y uso de recursos.",
      stats: {
        girlsHelped: "Ninas ayudadas",
        yearsOfService: "Anos de servicio",
        activeDonors: "Donantes activos",
        operatingSafeHouses: "Casas seguras operando",
      },
      cards: {
        outcomes: {
          title: "Los Resultados",
          description:
            "Seguimos resultados agregados para entender cuantas ninas reciben apoyo y como avanzan las metas clave en el tiempo.",
        },
        progress: {
          title: "El Progreso",
          description:
            "Los indicadores de progreso ayudan al equipo a mejorar planes de cuidado, detectar necesidades y fortalecer el apoyo.",
        },
        resourceUse: {
          title: "El Uso de los Recursos",
          description:
            "Los recursos de donantes y operacion se resumen a alto nivel para transparencia y privacidad de cada persona.",
        },
      },
      preview: {
        outcomes: {
          girlsReintegrated: "Ninas reintegradas",
          activeResidents: "Ninas en casos activos",
          openCases: "Casos abiertos",
        },
        progress: {
          schoolAttendance: "Asistencia escolar",
          educationGrowth: "Crecimiento educativo (trimestre)",
          processSessionsThisMonth: "Sesiones de apoyo este mes",
        },
        resourceUse: {
          programAllocation: "Asignacion a programas",
          costPerGirl: "Costo promedio por nina",
          recurringDonors: "Porcentaje de donantes recurrentes",
        },
      },
      pillars: {
        title: "La seguridad, la sanacion, y el ánimo",
        safety: {
          title: "La Seguridad",
          description:
            "Priorizamos planes de seguridad inmediatos y ubicacion estable para que cada nina inicie su recuperacion en un entorno seguro.",
        },
        healing: {
          title: "La Sanacion",
          description:
            "Las ninas reciben apoyo informado por trauma, seguimiento de caso y acompanamiento constante para fortalecer su bienestar.",
        },
        justice: {
          title: "La Justicia",
          description:
            "Cuando se solicita, apoyamos rutas legales con coordinacion, defensa y seguimiento documentado del progreso de cada caso.",
        },
        empowerment: {
          title: "El Ánimo",
          description:
            "Educacion, habilidades para la vida e integracion comunitaria ayudan a pasar de la crisis a una mayor independencia.",
        },
      },
      campaign: {
        title: "Ruedas de Esperanza",
        description:
          "El transporte es clave para seguridad, acceso a tribunales, continuidad escolar y salud. El apoyo a esta campana mantiene servicios esenciales.",
        cta: "Apoyar la campana",
      },
    },
    donate: {
      hero: {
        title: "Apoya su futuro",
        subtitle:
          "Cada donacion se usa para ayudar a las ninas a encontrar seguridad, sanacion y oportunidades.",
        alt: "Donar para apoyar a las ninas",
      },
      form: {
        title: "Haz una donacion",
        nameLabel: "Nombre",
        namePlaceholder: "Tu nombre completo",
        emailLabel: "Correo electronico",
        emailPlaceholder: "tu@ejemplo.com",
        amountLabel: "Monto de donacion",
        amountPlaceholder: "50.00",
        submit: "Donar",
      },
      cards: {
        why: {
          title: "Por que importan las donaciones",
          description:
            "Las donaciones financian operaciones de refugio, apoyo de casos, servicios educativos, alimentos y transporte para que las ninas sigan construyendo vidas seguras y estables.",
        },
        operations: {
          title: "Mantener a los servicios",
          description:
            "Se necesita financiamiento constante cada mes para mantener casas seguras, programas, personal y cuidado diario totalmente operativos para cada nina.",
        },
        gratitude: {
          title: "Gracias",
          description:
            "Estamos profundamente agradecidas por cada aporte. Cada centavo se usa para ayudar a las ninas con seguridad, sanacion y apoyo a largo plazo.",
        },
      },
      toast: {
        title: "Gracias por tu generosidad",
        description: "Cada donacion ayuda a las ninas a acceder a seguridad, sanacion y esperanza.",
      },
    },
    donorPortal: {
      header: {
        welcomeBack: "Bienvenido de nuevo",
        welcomeBackWithName: "Bienvenido de nuevo, {{name}}",
        subtitle: "Gracias por tu apoyo continuo a Refugio de Esperanza.",
      },
      stats: {
        totalDonated: "Total donado",
        donationsMade: "Donaciones realizadas",
        yearsSupporting: "Años de apoyo",
      },
      allocation: {
        title: "Tu impacto",
        totalAllocated: "Total asignado: {{amount}}",
        noAllocations: "Aún no hay registros de asignación.",
        supporting: "Apoyando: {{list}}",
        table: {
          programArea: "Área del programa",
          amount: "Monto asignado",
        },
      },
      history: {
        title: "Historial de donaciones",
        description: "Las donaciones se vinculan automáticamente con el correo de tu cuenta ({{email}}).",
        loading: "Cargando tu historial de donaciones…",
        emptyTitle: "Aún no hay donaciones para este correo",
        emptyDescription:
          "Si donaste con otro correo electrónico, inicia sesión con esa dirección para ver tu historial de donaciones.",
        makeDonation: "Hacer una donación",
        via: "{{type}} a través de {{channel}}",
        toSafehouse: "{{program}}: {{amount}} a {{safehouse}} ({{city}}, {{country}})",
      },
      errors: {
        loadFailed: "No pudimos cargar tu historial de donaciones en este momento.",
      },
    },
    caseload: {
      sidebar: {
        dashboard: "Panel",
        residents: "Residentes",
        donations: "Donaciones",
        caseConferences: "Conferencias de caso",
        safehouses: "Casas seguras",
        reports: "Reportes",
        settings: "Configuracion",
      },
      header: {
        kicker: "Gestion de casos",
        title: "Las Residentes",
        description: "Ver, buscar, filtrar y mantener expedientes de residentes.",
      },
      common: {
        all: "Todos",
      },
      filters: {
        search: "Buscar",
        searchPlaceholder: "Nombre/codigo, trabajadora, categoria, casa segura",
        caseStatus: "Estado del caso",
        safehouse: "Casa segura",
        caseCategory: "Categoria del caso",
        socialWorker: "Trabajadora social",
      },
      list: {
        residentCount_one: "{{count}} residente",
        residentCount_other: "{{count}} residentes",
        perPage: "Por pagina",
      },
      cards: {
        unnamedResident: "Residente sin nombre",
        socialWorker: "Trabajadora social",
        unassigned: "Sin asignar",
        noStatus: "Sin estado",
        dobNotSet: "Fecha de nacimiento no definida",
        noCategory: "Sin categoria",
        noSubcategories: "Sin subcategorias",
      },
      pagination: {
        previous: "Anterior",
        next: "Siguiente",
        pageOf: "Pagina {{page}} de {{total}}",
      },
      dialogs: {
        profileTitle: "Perfil de residente",
        createTitle: "Crear residente",
      },
      actions: {
        addResident: "Agregar residente",
        edit: "Editar",
        cancelEdit: "Cancelar edicion",
        save: "Guardar",
        cancel: "Cancelar",
      },
      fields: {
        residentCode: "Nombre/codigo de residente",
        internalCode: "Código interno",
        firstName: "Nombre",
        lastName: "Apellido",
        caseControlNo: "No. de control del caso",
        caseStatus: "Estado del caso",
        caseCategory: "Categoria del caso",
        caseCategoryPlaceholder: "Elige una categoria",
        safehouse: "Casa segura",
        assignedSocialWorker: "Trabajadora social asignada",
        dateOfBirth: "Fecha de nacimiento",
        dateOfAdmission: "Fecha de admision",
        referralSource: "Fuente de referencia",
        reintegrationStatus: "Estado de reintegracion",
        pwdType: "Tipo de discapacidad",
        specialNeedsDiagnosis: "Diagnostico de necesidades especiales",
        restrictedNotes: "Notas restringidas",
      },
      sections: {
        caseSubcategories: "Subcategorias del caso",
        familyProfile: "Perfil socio-demografico familiar",
      },
      subCategories: {
        subCatOrphaned: "Huerfana",
        subCatTrafficked: "Victima de trata",
        subCatChildLabor: "Trabajo infantil",
        subCatPhysicalAbuse: "Maltrato fisico",
        subCatSexualAbuse: "Abuso sexual",
        subCatOsaec: "OSAEC",
        subCatCicl: "CICL",
        subCatAtRisk: "En riesgo",
        subCatStreetChild: "Nina de la calle",
        subCatChildWithHiv: "Nina con VIH",
      },
      familyProfile: {
        familyIs4Ps: "Beneficiaria 4Ps",
        familySoloParent: "Madre/padre solo",
        familyIndigenous: "Grupo indigena",
        familyParentPwd: "Padre/madre con discapacidad",
        familyInformalSettler: "Asentamiento informal",
      },
      errors: {
        loadFailed: "No se pudieron cargar los datos de la carga de casos.",
        saveFailed: "No se pudieron guardar los cambios de la residente.",
      },
    },
  },
} as const;
