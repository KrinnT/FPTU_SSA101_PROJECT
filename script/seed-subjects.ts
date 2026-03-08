const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
    {
        semester: "Chưa rõ kỳ",
        subjects: ["Quy Định", "Hướng Dẫn Đăng Tài Liệu", "BDI301c", "DRS301", "DWB301", "ENM402", "ENW493c", "EPE301", "EPT24", "FRS401", "IAR401", "ITB302c", "PLT", "PRE301", "PRN222", "PRX301", "SDN302"]
    },
    {
        semester: "Kỳ 0",
        subjects: ["COV111", "COV121", "COV131", "ENT103", "ENT104", "ENT203", "ENT303", "ENT304", "ENT403", "ENT404", "ENT503", "EPT202", "TRANS 4", "TRANS 5", "TRANS 6"]
    },
    {
        semester: "Kỳ 1",
        subjects: ["ASI101", "CEA201", "CSI104", "CSI105", "CSI106", "DRS102", "DTG111", "EAW211", "ECN101", "ECO102", "ECO111", "ECR201", "ECR202", "ENG302c", "ENH301", "ENM112c", "ENM301", "ENM302", "ENP102", "FMM101", "HMO102", "JPD116", "JPD126", "KRL112", "LAE101", "MAC102", "MAE101", "MED201", "MGT103", "MKT101", "PFP191", "PRF192", "SDI101m", "SSC102", "SSL101c"]
    },
    {
        semester: "Kỳ 2",
        subjects: ["ACC101", "AET101", "AET102", "AIG201c", "AIG202c", "CMC201", "CPP201b", "CSD203", "DRP101", "DTG201", "EAL201", "EAW221", "ECB101", "ECN211", "ECO121", "ELC201", "ENH401", "ENM211c", "ENM401", "EVN202", "FOM200", "HOM202", "HOM301c", "IAO201c", "IAO202", "JPD216", "JPD226", "KRL122", "LAB221c", "LTG202", "MAD101", "MMK101", "MMP201", "NWC203c", "NWC204", "OBE102c", "OSG202", "PRN212", "PRO191", "PRO192", "PRO201", "SCC201", "SSC101", "SSG104", "TAB201"]
    },
    {
        semester: "Kỳ 3",
        subjects: ["ACC305", "ADY201m", "AFA201", "ANS201", "BDM201", "BKG201", "BUE201", "CAA201", "CAD201", "CHI411", "CSD201", "DBI202", "DMA301m", "DTG302", "DTG303", "ECN221", "ECO201", "ENM221c", "ERW411", "FIN201", "FIN202", "FIN301", "GDF102", "HOD102", "HRM201c", "HRM202c", "HSK200", "IBC201", "IBI101", "ITE303c", "JIJ301", "JPD113", "JPD326", "KRL212", "KRL222", "LAB211", "LIT301", "MAI391", "MKT201", "MKT304", "MKT318m", "MMP101", "NWC303", "PFD201", "RMC201", "SDP201", "SEM101", "SSC302c", "TTG201", "VCM202", "VNC104", "WED201c"]
    },
    {
        semester: "Kỳ 4",
        subjects: ["ACC302", "AIL303m", "ANB401", "ANS301", "BCJ201c", "CCO201", "CHI421", "CHN111", "CSP201m", "DAP391m", "DRD204", "DXD391c", "DXE291c", "ECC301c", "EDT202c", "ELP311c", "ERW421", "ESL101", "FBM201", "FIN303", "GDF201", "IBF301", "IMC301c", "IOT102", "IPR102", "ITA203c", "JPB301", "JPD123", "JPD336", "JPD346", "KRG301", "KRL312", "KRL322", "MAS202", "MAS291", "MKT202", "MKT328m", "MPL201", "MSM201c", "OSP201", "PIA201c", "PRC391c", "PRC392c", "PRE202", "PRJ301", "PRJ302", "PST202", "SCM201", "SCM202", "SSM201", "SSP201", "SWE201c", "TPG203", "TTD202", "TTM201", "VDP201", "WMC201"]
    },
    {
        semester: "Kỳ 5",
        subjects: ["CHN113", "CHN122", "CHN123", "CRY303c", "CSR301", "DBS401", "DMS301m", "DPL301m", "DPL302m", "DTA301", "DTG102", "DWP301c", "EBC301c", "EBN301", "ELP321c", "ELT301", "ENB301", "FER201m", "FER202", "FIM302c", "FIN402", "FRS301", "HOA102", "IAA202", "IAM302", "IEI301", "IIP301", "ISM302", "ISP392", "ITA301", "ITE302c", "JBI301", "JBT301", "JIG301", "JJB391", "JPD133", "JPE301", "JSC301", "KOR311", "MCO201", "MKT205c", "MKT208c", "PRN211", "PRN292c", "PRP201c", "RES213", "RES301", "RMB302", "SAL301", "SAP341", "SCM301m", "SEG301m", "SSB201", "SWP391", "SWR302", "SWT301", "TMG301m", "TTM202", "TTM203", "WBS200"]
    },
    {
        semester: "Kỳ 6",
        subjects: ["ENW492c", "NLP301c", "OJT202"]
    },
    {
        semester: "Kỳ 7",
        subjects: ["ADS301m", "AIL302m", "AIT301", "BDI302c", "BRA301", "CHN132", "DAT301m", "ELT401", "EVN201", "EXE_101", "HOD401", "IAP301", "IAW301", "IIV301", "IMP301", "ISC301", "ISC302", "ITB301c", "JPD316", "JTE301", "KMS301", "KOR321", "LAW102", "LAW201", "LOG311", "MKT209m", "MKT309m", "PRM392", "PRN221", "PRU211m", "PRU212", "RMC301", "RMC301m", "SAP311", "SAP331", "SDN301m", "SSN301", "SWC201", "SWD391", "SWD392", "SYB302c", "WBS220", "WDU202c"]
    },
    {
        semester: "Kỳ 8",
        subjects: ["AID301c", "BKG302", "BPS301", "CPV301", "DBM301", "DBW301", "DSS301", "EXE201", "IFT201c", "JIS401", "JIT301", "JIT401", "JIT491", "KOR411", "LOG321", "MKT301", "MLN101", "MLN111", "MLN122", "MMA301", "PMG201c", "PMG202c", "PRN231", "PRU221", "PRU221m", "REL301m", "RMB301", "SAP321", "SPM401", "WDP301", "WDU203c"]
    },
    {
        semester: "Kỳ 9",
        subjects: ["HCM201", "HCM202", "ISP490", "MLN131", "SEO102c", "SEO201c", "SEP490", "VNR201", "VNR202"]
    }
];

async function main() {
    console.log("Start seeding...");

    for (const item of data) {
        const sem = await prisma.semester.upsert({
            where: { name: item.semester },
            update: {},
            create: { name: item.semester },
        });

        console.log(`Ensured Semester: ${sem.name} (${item.subjects.length} subjects)`);

        for (const sub of item.subjects) {
            const code = sub.trim();
            await prisma.subject.upsert({
                where: { code },
                update: { semesterId: sem.id }, // Make sure it sits in the right semester
                create: {
                    code,
                    semesterId: sem.id
                }
            });
        }
    }

    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
