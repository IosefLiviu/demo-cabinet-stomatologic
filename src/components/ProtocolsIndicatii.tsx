import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, FileText, Stethoscope, Baby, AlertTriangle, Scissors, Heart, Smile, Crown, CircleDot } from 'lucide-react';
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
          @page { size: A4; margin: 10mm; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 10pt; 
            line-height: 1.4;
            color: #333;
            padding: 15px;
          }
          h1 { 
            font-size: 16pt; 
            color: #b8860b; 
            border-bottom: 2px solid #b8860b;
            padding-bottom: 6px;
            margin-bottom: 12px;
          }
          h2 { 
            font-size: 12pt; 
            color: #b8860b; 
            margin-top: 14px;
            margin-bottom: 8px;
          }
          h3 {
            font-size: 11pt;
            color: #374151;
            margin-top: 12px;
            margin-bottom: 6px;
          }
          p { margin: 6px 0; }
          ul, ol { 
            margin: 6px 0 6px 16px;
            padding-left: 8px;
          }
          li { margin: 3px 0; }
          .warning { 
            background: #fef3c7; 
            border-left: 3px solid #f59e0b;
            padding: 8px 12px;
            margin: 10px 0;
          }
          .important {
            background: #fee2e2;
            border-left: 3px solid #ef4444;
            padding: 8px 12px;
            margin: 10px 0;
            font-weight: 600;
          }
          .info {
            background: #eff6ff;
            border-left: 3px solid #3b82f6;
            padding: 8px 12px;
            margin: 10px 0;
          }
          .section {
            margin-bottom: 16px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 2px solid #b8860b;
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
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #b8860b;
            font-size: 8pt;
            color: #6b7280;
            text-align: center;
          }
          .medication-box {
            background: #fefce8;
            border: 1px solid #b8860b;
            border-radius: 6px;
            padding: 10px;
            margin: 10px 0;
          }
          .medication-box h3 {
            color: #b8860b;
            margin-top: 0;
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
            <TabsTrigger value="ind-canal" className="gap-1 text-xs sm:text-sm py-2">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Ind. Tratament Canal</span>
            </TabsTrigger>
            <TabsTrigger value="ind-extractie" className="gap-1 text-xs sm:text-sm py-2">
              <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Ind. Extracție</span>
            </TabsTrigger>
            <TabsTrigger value="ind-extractie-copii" className="gap-1 text-xs sm:text-sm py-2">
              <Baby className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Ind. Extracție Copii</span>
            </TabsTrigger>
            <TabsTrigger value="ind-proteze" className="gap-1 text-xs sm:text-sm py-2">
              <Smile className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Ind. Proteze</span>
            </TabsTrigger>
            <TabsTrigger value="ind-implant" className="gap-1 text-xs sm:text-sm py-2">
              <CircleDot className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Ind. Implant</span>
            </TabsTrigger>
            <TabsTrigger value="ind-cimentari" className="gap-1 text-xs sm:text-sm py-2">
              <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Ind. Cimentări</span>
            </TabsTrigger>
            <TabsTrigger value="protocol-extractii" className="gap-1 text-xs sm:text-sm py-2">
              <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Protocol Extracții</span>
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
              <TabsContent value="ind-canal" className="mt-0">
                <IndicatiiTratamentCanal />
              </TabsContent>
              <TabsContent value="ind-extractie" className="mt-0">
                <IndicatiiExtractie />
              </TabsContent>
              <TabsContent value="ind-extractie-copii" className="mt-0">
                <IndicatiiExtractieCopii />
              </TabsContent>
              <TabsContent value="ind-proteze" className="mt-0">
                <IndicatiiProteze />
              </TabsContent>
              <TabsContent value="ind-implant" className="mt-0">
                <IndicatiiImplant />
              </TabsContent>
              <TabsContent value="ind-cimentari" className="mt-0">
                <IndicatiiCimentari />
              </TabsContent>
              <TabsContent value="protocol-extractii" className="mt-0">
                <ProtocolExtractii />
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

const IndicatiiTratamentCanal = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      Indicații post-tratament endodontic
    </h1>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Durere și discomfort</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Durerea poate varia, de la absența ei până la dureri de intensitate mai ridicată, în acest caz începem un protocol medicamentos.</li>
        <li><strong>Durerea/Jena post-tratament endodontic este acceptată în literatura de specialitate ca fiind normală până la o lună.</strong> Nu este nici un motiv de îngrijorare.</li>
        <li>Pentru a permite vindecarea la vârful rădăcinilor, o săptămână post-tratament evităm alimentele dure.</li>
        <li>2 zile după tratament evităm activitatea fizică intensă.</li>
        <li>Evită mestecatul pe partea dintelui tratat până la finalizarea definitivă a tratamentului (obturare definitivă sau coroană).</li>
        <li>Evită alimente dure, lipicioase sau foarte fierbinți în primele zile.</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Simptome posibile</h2>
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 my-3">
        <p>Dacă simțiți pulsații, zvâcniri în zona tratată, umflături, scoatem pansamentul provizoriu lăsând dintele deschis (în acest caz anunțăm clinica/medicul, înainte de masă acoperim cavitatea cu o buletă de vată).</p>
      </div>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Programări ulterioare</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Tratamentul de canal se finalizează, de regulă, în una sau mai multe ședințe, în funcție de caz.</li>
        <li>După sigilarea canalului/canalelor, dintele trebuie restaurat (obturat sau acoperit cu coroană).</li>
        <li className="font-semibold">Este esențial să nu amânați finalizarea tratamentului, pentru a preveni fractura dintelui sau reinfectarea.</li>
      </ul>
    </section>

    <section className="space-y-4 mt-6">
      <h2 className="text-lg font-semibold text-primary">Medicație recomandată</h2>
      
      <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Durere ușoară/moderată</h3>
        <p className="text-yellow-900">Ibuprofen 400 mg la 6h timp de 2 zile.</p>
      </div>
      
      <div className="bg-orange-50 border border-orange-400 rounded-lg p-4">
        <h3 className="font-semibold text-orange-800 mb-2">Durere intensă</h3>
        <p className="text-orange-900">Ketoprofenum 50 mg la 6h timp de 3 zile.</p>
      </div>
    </section>
  </div>
);

const IndicatiiExtractie = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      Indicații post-extracționale pentru pacient
    </h1>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Imediat după extracție</h2>
      
      <h3 className="font-semibold mt-3">1. Compresa cu tifon</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Mușcați ferm pe compresa aplicată, timp de 2 ore, fără să o schimbați des.</li>
        <li>Dacă sângerează și după, se poate pune o compresă nouă, o oră.</li>
      </ul>
      
      <div className="bg-red-50 border-l-4 border-red-500 p-3 my-3">
        <p className="font-semibold">2. Nu clătiți gura, nu eliminați saliva în primele 24h – riscați să dislocați cheagul de sânge și să sângerați iar.</p>
      </div>
      
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 my-3">
        <p><strong>3. Nu fumați, nu consumați alcool în primele 24–48h</strong> – întârzie vindecarea și pot provoca alveolită.</p>
      </div>
      
      <p className="ml-4"><strong>4.</strong> Nu folosiți scobitoare.</p>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Alimentație</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Evitați mâncarea fierbinte sau foarte rece în primele 24h.</li>
        <li>Preferabil: alimente moi la temperatura camerei (iaurt, supă călduță, piure).</li>
        <li className="font-semibold">Nu lactate, nu acidulat, nu aspirină.</li>
        <li>Mestecați pe partea opusă extracției.</li>
        <li>Nu folosiți paiul (efectul de sucțiune poate dizloca cheagul).</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Durere și umflare</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Este normală o durere ușoară–moderată și edem local 1–3 zile.</li>
        <li>Medicația antialgică/antiinflamatoare conform prescripției medicului.</li>
        <li>Aplicați comprese reci (gheață înfășurată într-un prosop) extern, pe obraz, câte 10–15 min, cu pauze, în primele 6–8h.</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Igienă orală</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Nu periați zona extracției în prima zi.</li>
        <li>Din ziua următoare: periaj blând, cu periuța moale, folosită doar pe zona extracției (restul dinților cu periuța normală).</li>
      </ul>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 my-3">
        <p><strong>Cu cât veți avea o igienă bună, vă veți vindeca mai bine. Cu cât veți evita zona de igienă, cu atât vă veți vindeca mai greu și mai dureros.</strong></p>
      </div>
    </section>
  </div>
);

const IndicatiiExtractieCopii = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      Indicații post-extracționale dinți de lapte
    </h1>

    <section className="space-y-3">
      <ol className="list-decimal list-inside space-y-3 ml-4 text-base">
        <li className="font-medium">
          <strong>Nu se mănâncă până nu dispare efectul anesteziei.</strong>
        </li>
        <li>
          Se menține compresa pe locul unde s-a realizat extracția, cel puțin <strong>30 de minute</strong>.
        </li>
        <li>
          Evităm alimentele dure, picante sau prea condimentate.
        </li>
        <li>
          <strong>Nu consumăm alimente fierbinți</strong> și nu folosim paiul.
        </li>
        <li>
          Alegem alimente moi, ușor de mestecat.
        </li>
        <li className="font-medium">
          <strong>Nu clătim gura în primele 24 de ore.</strong>
        </li>
        <li>
          În prima zi periem dinții cu grijă, <strong>fără a atinge zona extracției</strong>.
        </li>
      </ol>
    </section>

    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
      <p className="font-medium">Pentru orice întrebări sau nelămuriri, nu ezitați să contactați clinica noastră.</p>
    </div>
  </div>
);

const IndicatiiProteze = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      Indicații după predarea protezelor dentare
    </h1>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Adaptare și purtare</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Este normal să existe o perioadă de adaptare de câteva săptămâni: senzație de corp străin, salivă mai abundentă, mici dificultăți la vorbire sau masticație.</li>
        <li><strong>Citiți cu voce tare, vorbiți mai mult</strong> → ajută la adaptarea limbii.</li>
        <li>La început, consumați alimente moi, tăiate mărunt, mestecând pe ambele părți simultan.</li>
        <li>Evitați alimentele lipicioase, foarte dure sau fibroase (caramele, alune, carne cu fibre tari).</li>
        <li>Mâncarea nu va mai avea același gust, proteza acoperă destul de mult spațiu, senzația va fi diferită.</li>
        <li>Pentru confort sporit, lipiți protezele înainte de masă.</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Igienă</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li><strong>Scoateți și curățați proteza după fiecare masă</strong> (periaj cu periuță specială, apă și săpun neutru sau soluții speciale pentru proteze).</li>
        <li>Nu folosiți pastă de dinți (pot apărea depuneri pe proteză).</li>
        <li>Clătiți gura și masați gingiile cu o periuță moale sau cu degetul învelit în tifon.</li>
        <li><strong>Noaptea:</strong> în general se recomandă scoaterea protezei, pentru a odihni mucoasa, păstrând-o într-un pahar cu apă curată sau soluție dezinfectantă.</li>
      </ul>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 my-3">
        <p><strong>Dezinfectare săptămânală:</strong> O dată pe săptămână putem dezinfecta proteza cu tablete Corega: punem proteza într-un pahar cu apă, adăugând tableta Corega efervescentă - cât timp se dizolvă este activă.</p>
      </div>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Confort și verificare</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Pot apărea zone de presiune sau iritație; dacă durerea persistă, reveniți pentru ajustare (nu încercați să modificați singur proteza).</li>
        <li><strong>Veniți de câte ori este nevoie de retuș.</strong></li>
        <li>Dacă proteza se mobilizează sau creează disconfort major, anunțați medicul.</li>
      </ul>
    </section>
  </div>
);

const IndicatiiImplant = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      Indicații post-implant pentru pacient
    </h1>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">1. Compresa cu tifon</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Mușcați ferm pe compresa aplicată, timp de <strong>2 ore</strong>, fără să o schimbați des.</li>
        <li>Dacă sângerează și după, se poate pune o compresă nouă, o oră.</li>
      </ul>
    </section>

    <div className="bg-red-50 border-l-4 border-red-500 p-3 my-3">
      <p className="font-semibold">2. Nu clătiți gura, nu eliminați saliva în primele 24h – riscați să dislocați cheagul de sânge și să sângerați iar.</p>
    </div>

    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 my-3">
      <p><strong>3. Nu fumați, nu consumați alcool în primele 24–48h.</strong></p>
    </div>

    <section className="space-y-2">
      <p className="ml-4"><strong>4.</strong> Evitați efortul fizic intens, aplecările bruste, ridicarea de greutăți.</p>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 my-3">
        <p><strong>5. Dacă s-a efectuat ridicare de sinus:</strong> evitați obstrucția nazală (spray decongestionant la nevoie), strănut cu gura larg deschisă.</p>
      </div>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">6. Alimentație</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Evitați mâncarea fierbinte sau foarte rece în primele 24h.</li>
        <li>Preferabil: alimente moi la temperatura camerei (iaurt, supă călduță, piure).</li>
        <li>Mestecați pe partea opusă implantului.</li>
        <li>Nu folosiți paiul (efectul de sucțiune poate dizloca cheagul).</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">7. Durere și umflare</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Este normală o durere ușoară–moderată și edem local 1–3 zile.</li>
        <li>Medicația antialgică/antiinflamatoare conform prescripției medicului.</li>
        <li>Aplicați comprese reci (gheață înfășurată într-un prosop) extern, pe obraz, câte 10–15 min, cu pauze, în primele 6–8h.</li>
        <li><strong>Inflamația maximă apare la 48-72 de ore de la intervenție.</strong></li>
        <li>Hematom (vânătaie) în zona facială este normal, se remite în 1-2 săptămâni.</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">Igienă orală</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Nu periați zona extracției în prima zi.</li>
        <li>Din ziua următoare: periaj blând, cu periuța moale, folosită doar pe zona extracției (restul dinților cu periuța normală).</li>
      </ul>
    </section>
  </div>
);

const IndicatiiCimentari = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      Indicații cimentare provizorie/definitivă
    </h1>

    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-primary">După cimentare provizorie</h2>
      
      <h3 className="font-semibold">1. Alimentație</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Evitați alimentele dure, lipicioase (caramele, gumă de mestecat) și foarte crocante – pot dezlipi coroana/puntea provizorie.</li>
        <li>Mestecați pe partea opusă dintelui lucrat, cât posibil.</li>
        <li>Evitați schimbările bruște de temperatură (foarte rece/fierbinte) dacă există sensibilitate.</li>
      </ul>

      <h3 className="font-semibold">2. Igienă orală</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Periaj normal, dar cu blândețe în zona lucrării.</li>
        <li><strong>Folosirea aței dentare:</strong> nu se scoate vertical (risc de smulgere a provizoriului), ci se trage lateral.</li>
      </ul>

      <h3 className="font-semibold">3. Confort și adaptare</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Este normal să existe o ușoară sensibilitate la rece/cald sau o senzație de "coroană înaltă" primele ore.</li>
        <li>Dacă mușcătura nu se simte corectă sau durerea este intensă și persistentă, reveniți la cabinet.</li>
      </ul>

      <h3 className="font-semibold">4. Durată și atenționări</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Lucrarea provizorie este temporară: trebuie păstrată până la definitivă.</li>
        <li className="font-semibold">Dacă se dezlipește, păstrați coroana curată și contactați medicul pentru recimentare.</li>
      </ul>
    </section>

    <section className="space-y-3 mt-6">
      <h2 className="text-lg font-semibold text-primary">După cimentare definitivă</h2>
      
      <h3 className="font-semibold">1. Alimentație</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Evitați mestecatul alimentelor dure și lipicioase în primele <strong>24 de ore</strong> (cimentul are nevoie de timp să se întărească complet).</li>
        <li>După 24h, se poate mânca normal, dar se recomandă prudență cu alimentele foarte dure.</li>
      </ul>

      <h3 className="font-semibold">2. Igienă orală</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Periaj riguros, de 2–3 ori pe zi.</li>
        <li>Folosiți ața dentară și/sau periuțele interdentare, după caz.</li>
        <li>Apa de gură fluorurată poate fi utilă pentru protecția dinților de sub lucrare.</li>
      </ul>

      <h3 className="font-semibold">3. Confort și adaptare</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>O ușoară sensibilitate la rece/cald este normală câteva zile.</li>
        <li>Dacă apare durere persistentă, mobilitate sau senzația că "încurcă" mușcătura, anunțați medicul.</li>
      </ul>

      <h3 className="font-semibold">4. Monitorizare</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Recomandare pentru controale periodice la 6 luni.</li>
        <li>Evitați obiceiuri precum roaderea unghiilor, obiectelor dure sau deschiderea ambalajelor cu dinții.</li>
      </ul>
    </section>
  </div>
);

const ProtocolExtractii = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
      Protocol pentru extracția dentară
    </h1>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">1. Evaluare preoperatorie</h2>
      
      <h3 className="font-semibold">1.1. Anamneză</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Alergii (în special la anestezice locale, antibiotice, analgezice)</li>
        <li>Medicație curentă (în special anticoagulante, bifosfonați, antidiabetice)</li>
        <li>Boli sistemice: diabet, boli cardiace, hipertensiune, boli hematologice</li>
        <li>Episod de infecție recentă / febră</li>
      </ul>

      <h3 className="font-semibold">1.2. Examinare clinică</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Mobilitatea dintelui</li>
        <li>Gradul de distrucție coronară</li>
        <li>Prezența fistulelor, supurației</li>
        <li>Gingivita, parodontita locală</li>
        <li>Relația cu dinții vecini, edentații, ocluzia</li>
      </ul>

      <h3 className="font-semibold">1.3. Examinare imagistică</h3>
      <p className="ml-4">Radiografie retroalveolară / panoramică. Evaluarea:</p>
      <ul className="list-disc list-inside space-y-1 ml-6">
        <li>număr rădăcini, curbura lor</li>
        <li>grosimea osului vestibular/lingual</li>
        <li>relația cu structurile anatomice (sinus maxilar, canal mandibular)</li>
        <li>prezența leziunilor periapicale</li>
        <li>resorbții sau calcificări</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">2. Pregătirea pacientului și a câmpului operator</h2>
      
      <h3 className="font-semibold">2.1. Pregătire pacient</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Clătire orală antiseptică (ex. clorhexidină 0,12–0,2%)</li>
        <li>Explicarea procedurii și obținerea consimțământului informat</li>
      </ul>

      <h3 className="font-semibold">2.2. Pregătirea câmpului operator</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Spălarea și dezinfectarea mâinilor</li>
        <li>Izolare cu aspirator și tampoane</li>
        <li>Poziționarea pacientului:
          <ul className="list-disc list-inside ml-4 mt-1">
            <li>maxilar: planul ocluzal la 45° față de podea</li>
            <li>mandibulă: pacientul aproape orizontal, capul ușor ridicat</li>
          </ul>
        </li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">3. Anestezia locală</h2>
      
      <h3 className="font-semibold">3.1. Tipuri de anestezie</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li><strong>Infiltrativă:</strong> pentru majoritatea dinților maxilari și incisivi/canini mandibulari</li>
        <li><strong>Blocaj troncular (mandibular):</strong> pentru molarii/premolarii mandibulari</li>
        <li>Intraligamentară / intraseptală dacă este necesar suplimentar</li>
      </ul>

      <h3 className="font-semibold">3.2. Confirmarea eficienței anesteziei</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Senzația de amorțeală în buze/obraz (pentru blocaj)</li>
        <li>Test tactil/termic la nivel gingival</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">4. Etapele extracției dentare</h2>
      
      <h3 className="font-semibold">4.1. Faza de ancorare și inserare a instrumentelor</h3>
      <p className="ml-4 font-medium">A. Desprinderea gingivală (sindesmotomie)</p>
      <p className="ml-4">Se folosește elevatoare sau sindesmotom pentru: eliberarea ligamentelor parodontale; acces mai bun pentru forceps.</p>
      
      <p className="ml-4 font-medium mt-2">B. Luxarea inițială</p>
      <p className="ml-4">Se folosește elevator drept, poziționat în spațiul interdentare. Mișcări: rotatorii ușoare; balansare controlată. Scop: întreruperea ligamentelor parodontale; mobilizarea dintelui.</p>

      <h3 className="font-semibold">4.2. Faza de prindere cu forcepsul</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Forcepsul se plasează cât mai apical pe rădăcină</li>
        <li>Verificarea prinderii ferme, fără alunecare</li>
      </ul>

      <h3 className="font-semibold">4.3. Faza de mobilizare cu forcepsul</h3>
      <p className="ml-4 font-medium">A. Dinți cu o singură rădăcină (incisivi, canini, premolari superiori)</p>
      <ul className="list-disc list-inside space-y-1 ml-6">
        <li>Mișcări buco-oral progresiv, crescând amplitudinea</li>
        <li>Rotatorii (numai pentru dinții cu rădăcină rotundă: incisivi, canini)</li>
      </ul>
      
      <p className="ml-4 font-medium mt-2">B. Dinți pluriradiculari (molari)</p>
      <ul className="list-disc list-inside space-y-1 ml-6">
        <li>Mișcări buco-oral cu creșterea treptată a forței</li>
        <li className="font-semibold">Fără rotație (risc de fractură radiculară)</li>
      </ul>

      <p className="ml-4 font-medium mt-2">C. Pentru dinții superiori posteriori</p>
      <p className="ml-6">Mișcare finală de tracțiune în jos și vestibular.</p>

      <p className="ml-4 font-medium mt-2">D. Pentru dinții inferiori posteriori</p>
      <p className="ml-6">Mișcare finală de tracțiune în sus și ușoară rotație mezială.</p>

      <h3 className="font-semibold">4.4. Extracția propriu-zisă</h3>
      <p className="ml-4">Odată ce ligamentele sunt rupte și osul a cedat elastic, dintele iese din alveolă. Control fin al forței pentru a evita: fracturi radiculare; fracturi de corticală.</p>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">5. Manevre postextracționale</h2>
      
      <h3 className="font-semibold">5.1. Chiuretaj și inspectarea alveolei</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Se chiuretează resturile patologice (granulații, țesut infectat)</li>
        <li>Se palpează alveola pentru detectarea: rădăcinilor rămase; septurilor fracturate; comunicărilor oro-sinusale</li>
      </ul>

      <h3 className="font-semibold">5.2. Lavaj</h3>
      <p className="ml-4">Irigare cu ser fiziologic steril.</p>

      <h3 className="font-semibold">5.3. Hemostază</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Compresă cu tifon sterile 20–30 minute</li>
        <li>În caz de sângerare: spongostan / colagen; suturi (simple sau în U)</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">6. Instrucțiuni postoperatorii pentru pacient</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Menține compresa 30 min</li>
        <li className="font-semibold">Nu clăti gura și nu scuipa 24h</li>
        <li className="font-semibold">Nu fuma 48–72h</li>
        <li>Dietă moale, evită sucuri/carbogazoase fierbinți</li>
        <li>Gheață extern 10–15 min, repetat</li>
        <li>Începând cu ziua 2: clătiri cu apă de gură cu clorhexidină</li>
        <li>Analgezice: ibuprofen/paracetamol (conform indicației medicale)</li>
        <li className="font-semibold">Revenire dacă apar: dureri puternice, halitoză severă, febră, sângerare persistentă</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-primary">7. Complicații posibile și management scurt</h2>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li><strong>Fractură radiculară</strong> → extragere cu elevator sau ferăstrău piezo, dacă e accesibilă</li>
        <li><strong>Fractură corticală vestibulară</strong> → dacă e mică: lăsată în poziție; dacă e mare: repoziționare + sutură</li>
        <li><strong>Hemoragie</strong> → compresie, agenți hemostatici, sutură</li>
        <li><strong>Alveolită postextracțională</strong> → lavaj + pansament cu eugenol</li>
        <li><strong>Comunicare oro-sinuzală</strong> → test Valsalva, sutură în U sau lambou (după caz)</li>
      </ul>
    </section>
  </div>
);

export default ProtocolsIndicatii;
