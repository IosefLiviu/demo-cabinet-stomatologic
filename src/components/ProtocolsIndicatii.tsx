import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, FileText, Stethoscope, Baby, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const ProtocolsIndicatii = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeProtocol, setActiveProtocol] = useState('consult');

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Protocol</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 11pt; 
            line-height: 1.5;
            color: #333;
            padding: 20px;
          }
          h1 { 
            font-size: 18pt; 
            color: #1e40af; 
            border-bottom: 2px solid #1e40af;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          h2 { 
            font-size: 14pt; 
            color: #1e40af; 
            margin-top: 20px;
            margin-bottom: 10px;
          }
          h3 {
            font-size: 12pt;
            color: #374151;
            margin-top: 16px;
            margin-bottom: 8px;
          }
          p { margin: 8px 0; }
          ul, ol { 
            margin: 8px 0 8px 20px;
            padding-left: 10px;
          }
          li { margin: 4px 0; }
          .warning { 
            background: #fef3c7; 
            border-left: 4px solid #f59e0b;
            padding: 10px 15px;
            margin: 15px 0;
          }
          .important {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 10px 15px;
            margin: 15px 0;
            font-weight: 600;
          }
          .section {
            margin-bottom: 20px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
          }
          .logo {
            width: 120px;
            height: auto;
          }
          .clinic-info {
            text-align: right;
            font-size: 9pt;
            color: #6b7280;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            font-size: 9pt;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/images/perfect-smile-logo-print.jpg" alt="Perfect Smile" class="logo" />
          <div class="clinic-info">
            <strong>PERFECT SMILE GLIM SRL</strong><br/>
            Str. Câmpulung Nr. 36, Sector 1, București<br/>
            Tel: 0770 450 180 | Email: office@perfectsmile.ro
          </div>
        </div>
        ${printContent}
        <div class="footer">
          © ${new Date().getFullYear()} PERFECT SMILE GLIM SRL - Toate drepturile rezervate<br/>
          www.perfectsmile.ro
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Protocoale & Indicații
        </CardTitle>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Printează
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeProtocol} onValueChange={setActiveProtocol} className="space-y-4">
          <TabsList className="flex flex-wrap w-full h-auto gap-1">
            <TabsTrigger value="consult" className="gap-1 text-xs sm:text-sm py-2">
              <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Consultație</span>
            </TabsTrigger>
            <TabsTrigger value="endodontie" className="gap-1 text-xs sm:text-sm py-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Endodonție</span>
            </TabsTrigger>
            <TabsTrigger value="carii-pedo" className="gap-1 text-xs sm:text-sm py-2">
              <Baby className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Carii Pedodonție</span>
            </TabsTrigger>
            <TabsTrigger value="traumatisme" className="gap-1 text-xs sm:text-sm py-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Traumatisme</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] rounded-md border p-4">
            <div ref={printRef}>
              <TabsContent value="consult" className="mt-0">
                <ProtocolConsult />
              </TabsContent>
              <TabsContent value="endodontie" className="mt-0">
                <ProtocolEndodontie />
              </TabsContent>
              <TabsContent value="carii-pedo" className="mt-0">
                <ProtocolCariiPedo />
              </TabsContent>
              <TabsContent value="traumatisme" className="mt-0">
                <ProtocolTraumatisme />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const ProtocolConsult = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      PROTOCOL CONSULTAȚIE
    </h1>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">1. Primirea pacientului și anamneza generală</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Boli sistemice: cardiace, diabet, alergii, hepatită, intervenții chirurgicale, medicație cronică</li>
        <li>Contraindicații anestezie, sângerare</li>
      </ul>
      <p className="font-medium">Pacienții cu boli de coagulare, cardiace, diabet, oncologice:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Foaie de la medicul curant pentru aprobarea actului stomatologic: anestezie, antibiotic, extracție, etc. cu mențiunea de sistare, unde este cazul, a vreunui medicament al pacientului și reluarea acestuia.</li>
      </ul>
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 my-3">
        <p className="font-semibold">*** Pacienții cu valve artificiale, operație pe cord deschis - CEREM ACORD CHIAR ȘI PENTRU DETARTRAJ DE LA MEDICUL CURANT</p>
      </div>
      <div className="bg-red-50 border-l-4 border-red-500 p-3 my-3">
        <p className="font-bold">*** Pacienții cu infarct miocardic mai recent de 6 luni - NU FACEM NIMIC!!! TRIMITEM PENTRU TRATAMENTE LA SPITAL</p>
        <p className="font-bold mt-2">FĂRĂ ACEASTĂ FOAIE NU MERGEM MAI DEPARTE CU TRATAMENTUL</p>
      </div>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">2. Anamneză stomatologică</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Istoric al tratamentelor stomatologice anterioare</li>
        <li>Motivele prezentării: durere, edentație, estetică, igienă</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">3. Examen clinic exobucal</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Simetrie facială, profil, raport buze/dinți, ATM</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">4. Examen endobucal</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Starea mucoasei: inflamație, leziuni</li>
        <li>Igiena orală: depozite tartru, placă</li>
        <li>Ocluzie, rapoartele intermaxilare</li>
        <li>Prezența parafuncțiilor: bruxism</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">5. Status dentar (diagnostic odontal)</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Tipul dentiției (temporară, definitivă, mixtă)</li>
        <li>Prezența/absența dinților pe fiecare arcadă, malpoziții: rotați, migrați, basculați (modifică poziția fără a-și păstra axul), translație (migrare cu păstrarea axului), extruzie (migrare în plan V fără proces alveolar), egresie (migrare în plan V cu proces)</li>
        <li>Leziuni carioase, tratate, netratate, corect sau incorect prin obturații</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Diagnostic parodontal</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Mobilitate dentară, adâncimea pungilor parodontale, halistereza (dispariția triunghiurilor interdentare gingivale), resorbții osoase orizontale/verticale</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Diagnostic chirurgical</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Dinți incluși, fracturi radiculare, chisturi, granuloame</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Diagnostic de edentație</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Tipul edentației, tipul protezării, corect, incorect</li>
      </ul>
      <p className="font-medium mt-2">Statusul pacientului se completează în Istoma împreună cu planul de tratament.</p>
    </section>
  </div>
);

const ProtocolEndodontie = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      Protocol ENDO
    </h1>

    <section className="space-y-2">
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>Îndepărtare dentină alterată</li>
        <li>Deschidere CP freză sferică sau butoi</li>
        <li>Îndepărtare pulpă cu ansa și reperarea canalelor cu ansa</li>
        <li>Pt a evita perforația și pentru a repera bine canalele finisăm podeaua CP cu freza de contraunghi</li>
        <li>După caz folosim tirnerf sau nu și irigăm canalele cu ser fiziologic/acid citric pentru a nu le înfunda</li>
      </ol>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">La molari</h2>
      <p>Prima intrare în canale o facem cu ace 6/8/10 pentru a nu face praguri și pentru a stabili lungimea de lucru.</p>
      <p>Irigăm cu ser fiziologic și băgăm ansa în fiecare canal reperat.</p>
      <p>Trecem la KERR 15 folosit împreună cu gel EDTA și încercăm să atingem lungimea de lucru. Dacă nu putem, irigăm și revenim la KERR 10.</p>
      <p>După ce am ajuns pe toată lungimea de lucru cu KERR 15 putem iriga și cu hipoclorit.</p>
      <p>Trecem la KERR 20 împreună cu gel EDTA și înaintăm, dacă nu putem atinge lungimea de lucru revenim la KERR 15 și tot așa.</p>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Tratamentul ROTATIV</h2>
      <p>Ar fi ideal să îl începem abia după ce am atins toată lungimea de lucru cu KERR 20 pentru a evita tensiunile mari în acul rotativ.</p>
      <p>Acele ROTATIVE le folosim cu MULT gel EDTA, iar între fiecare ac irigăm cu SER FIZIOLOGIC pentru a evita slăbirea structurii dentinare.</p>
      <p>Dacă am trecut la un ac ROTATIV mai mare dar avem dificultăți în a înainta în canal, aplicăm aceeași metodă ca la acele manuale și REVENIM la un ac mai mic.</p>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Finalizare și obturație</h2>
      <p>După ce am terminat de preparat canalul irigăm cu HIPOCLORIT și probăm conurile de guttapercha cu HIPOCLORITUL în canal.</p>
      <p>După ce ne-am ales conul de guttapercha terminăm de irigat cu HIPOCLORIT, iar apoi irigăm cu ser fiziologic.</p>
      <p>Ultima irigare o facem cu EDTA soluție pentru a permite sealer-ului o adeziune cât mai bună de dentină.</p>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Tratament intracanalar cu calciu</h2>
      <p>La dinții ce prezintă fistule sau secreție serioasă pe canale mai mult de o ședință se recomandă tratamentul intracanalar cu calciu 1-4 ședințe.</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Calciul se schimbă la 5-7 zile</li>
        <li>Dacă avem prezentă o fistulă, calciul se injectează până ce acesta iese prin orificiul de deschidere al fistulei</li>
      </ul>
      <p>După ce s-au efectuat ședințele necesare cu calciu (în unele cazuri după 4 săpt) se face o radiografie de control pentru a vedea că leziunea PA s-a micșorat, și inspectăm de asemenea și fistula să se fi închis.</p>
      <p>Dacă fistula s-a închis/leziunea PA s-a micșorat putem trece la obturarea canalului.</p>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Radiografiile retroalveolare</h2>
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 my-3">
        <p className="font-semibold">Nu se lucrează fără radiografie!</p>
      </div>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Extirparea o putem face și dacă avem OPG, dar obturația de canal necesită Rx retroalveolară pentru a ne putea verifica lungimea de lucru</li>
        <li>După obturația de canal facem o radiografie de control</li>
        <li>Pacientul trebuie să facă la 6 și la 12 luni Rx de control pentru a putea verifica dacă leziunea PA s-a micșorat</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Protezarea post-tratament</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Dinții ce au prezentat fistule, leziuni PA mari, retratamente cu leziuni PA mari, secreție seroasă/purulentă abundentă se protezează în prima instanță provizoriu (coroane PMMA)</li>
        <li>Peste 6 luni dacă pe Rx de control vedem o micșorare a leziunii PA, putem proteza dintele definitiv</li>
      </ul>
    </section>
  </div>
);

const ProtocolCariiPedo = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      PROTOCOL LEZIUNI CARIOASE DT (Dinți Temporari)
    </h1>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Evaluare inițială</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li><strong>Percuția este negativă</strong> – carie simplă DT</li>
        <li><strong>Percuția axială pozitivă</strong> – pulpită seroasă/purulentă totală în evoluție afectează țes. periapicale sau o parodontită apicală cronică</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Leziunile odontale - localizare și vârsta tratament</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li><strong>Grup frontal</strong> - se vor trata până la 5 ani</li>
        <li><strong>Zona de sprijin</strong> - se vor trata până la 10-11 ani (până la 8 ani toată zona, după 8 ani molar doi și canin temporar sup)</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Procedură tratament</h2>
      <p>Toaleta cavității cu clorhexidină sau ser fiziologic</p>
      <p>Restaurarea morfologiei coronare - de preferat CIS foto au proprietăți bioactive și permit mici imperfecțiuni tehnice.</p>
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 my-3">
        <p>Dacă deschizi accidental camera pulpară poți încerca un coafaj direct. Se face la DT imaturi, este contraindicat la cei îmbătrâniți, dă complicații pulpare, resorbții interne. Toaleta cav cu SF, clorhexidină și aplicarea unui material bioactiv (MTA). Deschiderea trebuie să fie mai mică de 1mm.</p>
      </div>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">DIAGNOSTIC POZITIV AL PULPITELOR</h2>
      <ol className="list-decimal list-inside space-y-1 ml-4">
        <li><strong>Inspecție</strong> - congestia gingivală la nivelul dintelui afectat</li>
        <li><strong>Durere ACUTĂ spontană la niv. DT</strong> - inflamație pulpară acută, sindrom de sept</li>
        <li><strong>Durere cronică, difuză la niv DT</strong> - inflamație cronică pulpară, necroză pulpară</li>
      </ol>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Pulpotomia vitală - indicații</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>DT cu carie profundă simptomatică</li>
        <li>DT cu carie profundă, cu deschidere accidentală a CP</li>
        <li>Traumatism dentar cu deschidere CP - DT în stadiu ½ de fractură coronară recentă</li>
        <li>Hipermie pulpară</li>
        <li>PASP</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">ETAPE - PULPOTOMIE</h2>
      <ol className="list-decimal list-inside space-y-1 ml-4">
        <li>Anestezie locală</li>
        <li>Îndepărtarea procesului carios și crearea accesului spre CP</li>
        <li>Îndepărtarea pulpei coronare - freze sferice, excavator</li>
        <li>Toaleta și hemostaza în camera pulpară cu buletă ser fiziologic sau apă oxigenată, cu fermitate pe orificiul fiecărui canal (lași buleta 15-30 sec)</li>
        <li>Hemoragia greu de controlat - aplici sulfat feric compresiv 2-3 minute (denumire comercială astringedent). Dacă nu se produce hemostaza se recurge la PULPECTOMIE</li>
        <li>Aplicarea la nivelul CP evidat materialul bioactiv de tip ZOE cu priză rapidă (pasta dirijată spre podeaua CP, exces îndepărtat cu bulete sterile) sau hidroxid de calciu</li>
        <li>Peste care aplicăm ZOE sau MTA</li>
        <li>Refacerea morfologiei - CIS</li>
        <li>Rx control</li>
        <li>Restaurarea coronară a dintelui (CIS, mat. compozit)</li>
        <li>Control Rx la 3 luni</li>
        <li>Prescriere de antialgice, dacă durerea persistă mai mult de 24 de ore trebuie să revină la control</li>
      </ol>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">PULPECTOMIE VITALĂ - indicații</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Pulpite totale ale DT din stadiul 2</li>
        <li>Evoluție nefavorabilă a pulpotomiei</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">ETAPELE PULPECTOMIEI</h2>
      <ol className="list-decimal list-inside space-y-1 ml-4">
        <li>RX - vezi poziția mugurelui DP în raport cu apex DT</li>
        <li>Anestezie locală</li>
        <li>Idem pulpotomie (pașii 2-4)</li>
        <li>Evidențiat punct de emergență canale radiculare</li>
        <li>Recomandare intrări 8 mm la DT tânăr molari, la incisivi, canini (5 mm)</li>
        <li>Ac tire nerv - 2, 3 rotații complete în sensul acelor de ceasornic sub irigare permanentă hipo 2,5-5% sau 2-3 picături de apă oxigenată în camera pulpară</li>
        <li>Se introduce Kerr file 15 - mișcări de răzuire a tuturor pereților</li>
        <li>Se irigă, se introduce Kerr file 20</li>
        <li>Se irigă, se revine la 15</li>
        <li>Se irigă, se trece la 25, se irigă și se revine la 20 Kerr (nu e obligatoriu să se ajungă la 25)</li>
        <li>Răzuim bine pereții cu 15, 20</li>
      </ol>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Tratamentul medicamentos</h2>
      <p className="font-medium">Când nu se poate efectua obturația de canal în aceeași ședință:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Pulpite purulente</li>
        <li>Pulpite cronice</li>
        <li>Contaminarea câmpului cu salivă</li>
        <li>Neterminarea instrumentării</li>
      </ul>
      <p className="mt-2">Se pune buletă cu CRESOPHEN SAU ANTIBIOTIC INTRODUS PE CANAL CU ACUL</p>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Obturația de canal</h2>
      <p>Pastă ZOE + iod sau hidroxid de calciu pulbere cu ser fiziologic se pune cu lentullo scurt (21 - roșu) sau ac Kerr</p>
      <p>Pasta de canal trebuie să acopere toată podeaua CP</p>
      <p>Obturație provizorie CIS</p>
      <p>Rx retro</p>
      <p>Restaurarea coronară dd - CIS, mat. compozit</p>
      <p className="font-medium">Control la 3 luni pentru aprecierea succes sau insucces</p>
    </section>
  </div>
);

const ProtocolTraumatisme = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      PROTOCOL PEDODONȚIE - TRAUMATISME DENTO-PARODONTALE DT
    </h1>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Prima ședință în urgență</h2>
      <p>Examenul clinic se rezumă la aprecierea mobilității + deplasări dentare:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Toaleta sumară a plăgilor muco-gingivale</li>
        <li>Identifici și îndepărtezi eventuali corpi străini</li>
        <li>Extracția dinților temporari FOARTE mobili</li>
        <li>Părinții instruiți să asigure copilului o alimentație moale, păstoasă timp de 1 săptămână și igienă riguroasă a cavității orale</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">CLASIFICAREA TRAUMATISMULUI</h2>
      
      <h3 className="text-md font-semibold mt-4">1. Fracturi coronare necomplicate care implică smalț/smalț + dentină</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Netezești marginile anfractuoase</li>
        <li>Doar în smalț faci fluorizare</li>
        <li>Implică dentina - restaurare cu sigilarea dentinei (calciu, CIS foto)</li>
        <li>Control 6-8 săptămâni și la 1 an</li>
      </ul>

      <h3 className="text-md font-semibold mt-4">2. Fracturi coronare complicate cu deschiderea CP</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>DT în stadiul ½ și fractură recentă - pulpotomie vitală</li>
        <li>În stadiu 2 și traumatism mai vechi - pulpectomie devitală (3/4 din rădăcină să fie prezente)</li>
        <li>Stadiu 3 - extracția</li>
        <li>Control periodic la 1 săpt, 6-8 săpt și la 1 an</li>
      </ul>

      <h3 className="text-md font-semibold mt-4">3. Fracturi radiculare</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>În 1/3 apicală - prognostic bun (fragmentul apical se resoarbe cu erupția DP), teoretic se depune țesut de granulație și mobilitatea este redusă - necesită control 2-3 săpt, 6-8 săpt, și la 1 an Rx (dacă apar semne de necroză, mobilitate excesivă) fragmentul coronar se extrage</li>
        <li>Localizare 1/3 cervicală și medie - extracție</li>
      </ul>

      <h3 className="text-md font-semibold mt-4">4. Fracturi corono-radiculare</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Dacă implicarea radiculară este redusă - îndepărtarea fragmentului coronar mobil și efectuarea pulpotomiei</li>
        <li>Dacă implicarea radiculară este mai mare sau există fragmente multiple - extracția DT</li>
      </ul>

      <h3 className="text-md font-semibold mt-4">5. Fracturi dento-alveolare</h3>
      <p className="ml-4">Chirurgie (calea Dudești)</p>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">TRAUMATISME LA NIVELUL ȚESUTURILOR DE SUSȚINERE</h2>

      <h3 className="text-md font-semibold mt-4">1. Subluxația</h3>
      <p className="ml-4">Lezarea + ruperea limitată a fibrelor ligamentare.</p>
      <p className="ml-4"><strong>Clinic:</strong> sângerare gingivală, iar dintele prezintă MOBILITATE FĂRĂ DEPLASARE + SENSIBILITATE LA PERCUȚIE</p>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 my-3 ml-4">
        <p><strong>Ce e de făcut?</strong> Vindecarea leziunii ligamentare prin scoaterea dintelui din ocluzie/repaus alimentar 1 săpt. + monitorizarea periodică</p>
      </div>

      <h3 className="text-md font-semibold mt-4">2. Contuzie</h3>
      <p className="ml-4">Afectarea limitată a țesutului ligamentar prin strivire fără deplasare dentară.</p>
      <p className="ml-4"><strong>Clinic:</strong> poate o sensibilitate la percuția în ax/în ocluzie datorată inflamației ligamentului parodontal. Nu mobilitate.</p>
      <p className="ml-4">Nu necesită tratament, doar monitorizare periodică și reguli stricte de igienă + alimentație moale timp de 1 săptămână</p>

      <h3 className="text-md font-semibold mt-4">3. Luxația</h3>
      <p className="ml-4">Ruperea mai extinsă a fibrelor ligamentare cu deplasarea dintelui din alveola dentară.</p>

      <h4 className="text-sm font-semibold mt-3 ml-4">LUXAȚIE CU EXTRUZIE</h4>
      <p className="ml-6">Dintele se deplasează din alveolă spre planul de ocluzie</p>
      <p className="ml-6"><strong>Clinic:</strong> sângerare gingivală, dd deplasat + mobilitate, sensibil la percuție</p>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 my-2 ml-6">
        <p><strong>Ce e de făcut?</strong></p>
        <ul className="list-disc list-inside mt-1">
          <li>Dacă dd nu e foarte mobil - repoziție imediată sub anestezie loco-regională, prin presiune digitală ușoară și imobilizare 7-14 zile (igienă riguroasă)</li>
          <li>Dacă dd e foarte mobil - extracție</li>
        </ul>
      </div>

      <h4 className="text-sm font-semibold mt-3 ml-4">LUXAȚIE LATERALĂ</h4>
      <p className="ml-6">Dd deplasat V/O dar NU MOBILITATE</p>

      <h4 className="text-sm font-semibold mt-3 ml-4">LUXAȚIE VESTIBULARĂ</h4>
      <p className="ml-6">Percuție SUNET METALIC - RX</p>
      <ul className="list-disc list-inside space-y-1 ml-8">
        <li>Dacă mugurele DP nu este afectat = expectativă, dintele se va repoziționa treptat sub acțiunea forței exercitate de către orbicularul buzei cu condiția suprimării obiceiurilor vicioase de supt</li>
        <li>Dacă mugurele DP este afectat = extracția</li>
      </ul>

      <h4 className="text-sm font-semibold mt-3 ml-4">LUXAȚIE ORALĂ - Angrenaj invers</h4>
      <p className="ml-6">Traumă ocluzală suplimentară - repoziție manuală sub anestezie loco-regională/topică</p>
      <p className="ml-6">Obligatoriu control la 2-3 săpt și RX la 6-8 săpt respectiv 1 an</p>
      <p className="ml-6">Părinții: igienă orală riguroasă, dietă moale 1 săpt</p>

      <h4 className="text-sm font-semibold mt-3 ml-4">LUXAȚIA CU INTRUZIE</h4>
      <p className="ml-6"><strong>Clinic:</strong> sângerare gingivală, vizibilitate redusă a coroanei pe arcada dentară, NU MOBILITATE, percuție sunet metalic</p>
      <p className="ml-6">Rx obligatoriu</p>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 my-2 ml-6">
        <p><strong>Ce e de făcut?</strong></p>
        <ul className="list-disc list-inside mt-1">
          <li>Dacă coroana nu mai e vizibilă în CB, iar dinele intrudat vine în contact cu mugurele DP = extracție</li>
          <li>Dacă coroana parțial vizibilă și nu afectează mugurele DP = expectativă 2-4 săpt. până când își va relua erupția spontan. Dacă nu - extracția</li>
        </ul>
        <p className="mt-2">Monitorizare periodică pe perioada expectativă - poate apărea necroză sau infecție = extracție</p>
      </div>

      <h3 className="text-md font-semibold mt-4">4. Avulsia</h3>
      <div className="bg-red-50 border-l-4 border-red-500 p-3 my-3">
        <p className="font-bold">Nu se face reimplantarea!</p>
      </div>
    </section>
  </div>
);

export default ProtocolsIndicatii;
