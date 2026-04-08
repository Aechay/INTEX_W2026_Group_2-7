import { Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuickExitButton from "@/components/QuickExitButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImage from "@/assets/hero-beach.jpg";

const Resources = () => {
  const resourceContacts = [
    {
      name: "Victim Support NGO",
      phone: "+1 809-565-5151",
      type: "24/7 Crisis Support",
    },
    {
      name: "CONANI",
      phone: "+1 (809) 567-2233",
      type: "National Child Helpline",
    },
    {
      name: "Hope Shelter Hotline",
      phone: "+1 (809) 555-7890",
      type: "Emergency Support",
    },
    {
      name: "Legal Aid Support",
      phone: "+1 (809) 555-3456",
      type: "Legal Assistance",
    },
  ];

  const safetySteps = [
    {
      title: "Trust your feelings",
      description:
        "If something feels wrong or unsafe, it is okay to step away and get help.",
    },
    {
      title: "Know safe adults",
      description:
        "Identify trusted adults you can talk to—family, teachers, counselors, or shelter staff.",
    },
    {
      title: "Have a safety plan",
      description:
        "Plan a safe place to go and a way to contact someone you trust in an emergency.",
    },
  ];


  const faqSections = [
    {
      title: "Understanding Abuse",
      items: [
        {
          question: "What is sexual abuse?",
          answer:
            <>
              <p className="mb-3">
                Sexual abuse is any sexual activity that happens without your clear, informed, and
                freely given consent. It includes acts where someone forces, pressures, manipulates,
                or coerces you into sexual activity. It also includes situations where you cannot
                consent, such as being underage, unconscious, asleep, or under the influence of
                drugs or alcohol.
              </p>
              <p className="mb-3">
                Abuse can occur in many settings: within families, in romantic relationships, at
                work, at school, or in any situation where someone abuses a position of trust or
                authority. It is never your fault, regardless of the circumstances.
              </p>
              <p>
                Resource:{" "}
                <a
                  href="https://www.rainn.org/articles/sexual-assault"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  RAINN – What is sexual assault?
                </a>
              </p>
            </>,
        },
        {
          question: "What are signs to watch for?",
          answer:
            <>
              <p className="mb-3">
                Abuse can affect people physically, emotionally, and socially. Signs may vary, but
                common indicators include:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>
                  Emotional or behavioral changes: sudden mood swings, anxiety, depression,
                  withdrawal from friends or family, loss of interest in activities.
                </li>
                <li>
                  Physical signs: unexplained bruises, injuries, or discomfort, frequent stomachaches
                  or headaches.
                </li>
                <li>
                  Relationship changes: fear of specific people, avoidance of certain places, or
                  extreme shyness.
                </li>
                <li>
                  Behavioral changes in children: regressions in behavior, nightmares, or difficulty
                  trusting adults.
                </li>
              </ul>
              <p className="mb-3">
                It is important to remember: not all signs are obvious, and experiencing one or two
                does not necessarily confirm abuse. Trust your instincts and seek guidance if
                something feels wrong.
              </p>
              <p>Resource: RAINN – Warning signs of sexual abuse.</p>
            </>,
        },
      ],
    },
    {
      title: "Immediate Help & Safety",
      items: [
        {
          question: "I am in danger right now. What should I do?",
          answer:
            <>
              <p className="mb-3">
                If you are in immediate danger, call 911 (Dominican Republic emergency number) or
                reach out to a trusted person nearby. Move to a safe location if possible. Do not
                hesitate—your safety is the priority.
              </p>
              <p className="mb-3">
                If you cannot call for help safely, try to find a public space or someone you trust
                to assist you. You can also contact local organizations for confidential help:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>
                  Ministerio de la Mujer (DR) – offers support and guidance for victims of
                  gender-based violence:{" "}
                  <a href="tel:+18096895888" className="text-primary hover:underline">
                    +1 809-689-5888
                  </a>{" "}
                  or{" "}
                  <a
                    href="mailto:info@ministeriodelamujer.gob.do"
                    className="text-primary hover:underline"
                  >
                    info@ministeriodelamujer.gob.do
                  </a>
                </li>
                <li>Línea de Emergencia 24/7: *212 – specialized support for victims of abuse</li>
              </ul>
              <p>
                Tip: Keep a list of emergency contacts and any important documents in a safe place
                if you are planning to leave an unsafe environment.
              </p>
            </>,
        },
        {
          question: "Can you help me create a safety plan?",
          answer:
            <>
              <p className="mb-3">
                Yes. A safety plan is a personalized set of strategies to help you protect yourself
                if you are at risk of harm. Key elements often include:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>Identifying safe locations (friend’s house, public places, shelters)</li>
                <li>Listing trusted people you can contact quickly</li>
                <li>Preparing emergency items (ID, phone, money, medications) in a safe place</li>
                <li>Planning exit strategies if you need to leave quickly</li>
                <li>Considering digital safety, such as limiting location sharing or passwords</li>
              </ul>
              <p className="mb-3">
                You do not have to do this alone. Advocates at helplines can help you create a
                step-by-step plan that suits your situation.
              </p>
              <p>
                Resource:{" "}
                <a
                  href="https://www.thehotline.org/plan-for-safety/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  National Domestic Violence Hotline – Safety planning guide (Spanish available)
                </a>
              </p>
            </>,
        },
      ],
    },
    {
      title: "Contacting the Helpline",
      items: [
        {
          question: "What happens when I call, text, or chat?",
          answer:
            <>
              <p className="mb-3">
                When you reach out, you will be connected with a trained advocate. They will listen
                to your experience without judgment, provide emotional support and validation,
                explain your options clearly, and connect you to local resources in the Dominican
                Republic if needed.
              </p>
              <p>
                You are in control of the conversation. You decide what to share, what steps to
                take, and how you want the conversation to proceed. Many people contact helplines
                just to talk, ask questions, or get guidance without any obligation to report.
              </p>
            </>,
        },
        {
          question: "Will you tell me what to do?",
          answer:
            <>
              <p className="mb-3">
                No. The helpline is not there to make decisions for you or pressure you into any
                action. The advocate’s role is to provide:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>Accurate information about options</li>
                <li>Emotional support and guidance</li>
                <li>Referrals to local resources, counseling, or shelters</li>
              </ul>
              <p>Ultimately, the choices are yours alone, and you can take things at your own pace.</p>
            </>,
        },
      ],
    },
    {
      title: "Confidentiality & Privacy",
      items: [
        {
          question: "Is this service confidential?",
          answer:
            <>
              <p className="mb-3">
                Yes. Your privacy is our priority. Conversations are confidential to the extent
                allowed by law.
              </p>
              <p className="mb-3">Certain situations may require reporting, such as:</p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>Abuse involving a minor</li>
                <li>Immediate danger to you or others</li>
              </ul>
              <p>
                Advocates will explain any limits to confidentiality before you share sensitive
                information.
              </p>
            </>,
        },
        {
          question: "Can I stay anonymous?",
          answer:
            "Absolutely. You can contact the helpline without giving your name, address, or other identifying details. You can still receive guidance, support, and access to resources while remaining anonymous.",
        },
      ],
    },
    {
      title: "Reporting & Legal Options",
      items: [
        {
          question: "Do I have to report the abuse?",
          answer:
            <>
              <p className="mb-3">
                No. Reporting is a personal choice. You can receive support and counseling without
                reporting to authorities. If you choose to report, the helpline can guide you
                through:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>Filing a police report in the Dominican Republic</li>
                <li>Contacting local prosecutors (Ministerio Público)</li>
                <li>Accessing victim protection programs</li>
              </ul>
              <p>Resource: Ministerio de la Mujer – Violence reporting and support.</p>
            </>,
        },
        {
          question: "What is a mandatory reporter?",
          answer:
            <>
              <p className="mb-3">
                A mandatory reporter is a person legally required to report suspected abuse,
                especially when it involves minors or vulnerable people. In the Dominican Republic,
                this often applies to teachers, doctors, social workers, and certain government
                employees.
              </p>
              <p className="mb-3">
                If mandatory reporting applies, advocates will clearly explain what must be
                reported so you can make informed decisions safely.
              </p>
              <p>
                Resource: Child Welfare Information Gateway – Mandatory reporting overview (general
                guidance; local laws vary).
              </p>
            </>,
        },
      ],
    },
    {
      title: "Emotional Support & Healing",
      items: [
        {
          question: "Is it normal to feel this way?",
          answer:
            <>
              <p className="mb-3">
                Yes. Experiencing sexual abuse can lead to a wide range of emotions: fear, guilt,
                shame, anger, confusion, or numbness. These are natural responses to trauma.
              </p>
              <p>
                Many survivors struggle with self-blame, but it is important to remember: you are
                never responsible for someone else’s abuse. Support from trained advocates,
                counselors, or peer groups can help you process and begin healing.
              </p>
            </>,
        },
        {
          question: "Can I talk to someone even if I’m not ready to report?",
          answer:
            <>
              <p className="mb-3">
                Yes. You do not need to report the abuse to seek support. Many people reach out
                simply to talk, ask questions, or explore options. Helplines can:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>Provide emotional support</li>
                <li>Explain resources and options in the Dominican Republic</li>
                <li>Help connect you with counseling, shelters, or legal support when you are ready</li>
              </ul>
              <p>
                Resource: Ministerio de la Mujer – Support and counseling:{" "}
                <a
                  href="mailto:info@ministeriodelamujer.gob.do"
                  className="text-primary hover:underline"
                >
                  info@ministeriodelamujer.gob.do
                </a>
              </p>
            </>,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <QuickExitButton />

      <main className="flex-1 bg-muted">
        <section className="relative py-20 overflow-hidden">
          <img
            src={heroImage}
            alt="Ocean shoreline"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Resources & Safety
            </h1>
            <p className="text-primary-foreground/90 max-w-3xl mx-auto">
              You are not alone. This page shares trusted resources, information about sexual
              abuse, and simple ways to stay safe.
            </p>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              Resource Contacts
            </h2>
            <div className="grid gap-8 lg:grid-cols-4">
              {resourceContacts.map((resource) => (
                <Card key={resource.name} className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Phone className="h-5 w-5 text-primary" />
                      {resource.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{resource.type}</p>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={`tel:${resource.phone.replace(/[^+\d]/g, "")}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      {resource.phone}
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqSections.map((section) => (
                <div key={section.title} className="bg-background rounded-2xl shadow-sm border">
                  <div className="px-6 py-5 border-b">
                    <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
                  </div>
                  <div className="px-6">
                    <Accordion type="single" collapsible>
                      {section.items.map((item) => (
                        <AccordionItem
                          key={item.question}
                          value={`${section.title}-${item.question}`}
                        >
                          <AccordionTrigger className="text-left text-foreground">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-muted-foreground">
              You are not alone. Help is available whenever you are ready.
            </p>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              Simple ways to stay safe
            </h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {safetySteps.map((step) => (
                <Card key={step.title} className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {step.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Resources;
