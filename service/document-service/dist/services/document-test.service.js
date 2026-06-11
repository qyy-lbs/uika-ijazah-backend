import { getAkademikProfileByNim } from "../clients/akademik.client.js";
import { getTemplateForDocument } from "../clients/template.client.js";
export async function testDocumentDependencies(nim) {
    const [profile, ijazahTemplate, transkripTemplate] = await Promise.all([
        getAkademikProfileByNim(nim),
        getTemplateForDocument("ijazah"),
        getTemplateForDocument("transkrip"),
    ]);
    return {
        mahasiswa: {
            nim: profile.mahasiswa?.nim,
            nama: profile.mahasiswa?.nama,
        },
        template: {
            ijazah: {
                id_template: ijazahTemplate.id_template,
                file_template: ijazahTemplate.file_template,
                total_elements: ijazahTemplate.konfigurasi_layout.elements.length,
            },
            transkrip: {
                id_template: transkripTemplate.id_template,
                file_template: transkripTemplate.file_template,
                total_elements: transkripTemplate.konfigurasi_layout.elements.length,
            },
        },
        transkrip: {
            total_mata_kuliah: profile.transkrip.length,
        },
    };
}
//# sourceMappingURL=document-test.service.js.map