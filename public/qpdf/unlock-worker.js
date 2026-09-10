self.onmessage = async (event) => {
  const { file, password } = event.data;

  try {
    const module = await import("/qpdf/qpdf.js");

    const qpdf = await module.default({
      locateFile: (filename) => `/qpdf/${filename}`,
    });

    qpdf.FS.writeFile("/input.pdf", new Uint8Array(file));

    const outputPath = "/output.pdf";

    const exitCode = qpdf.callMain([
      `--password=${password}`,
      "--decrypt",
      "/input.pdf",
      outputPath,
    ]);

    if (exitCode !== 0) {
      throw new Error("qpdf failed");
    }

    const output = qpdf.FS.readFile(outputPath);

    self.postMessage(
      {
        success: true,
        buffer: output.buffer,
      },
      [output.buffer]
    );

    try {
      qpdf.FS.unlink("/input.pdf");
      qpdf.FS.unlink(outputPath);
    } catch {}
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : "Unable to unlock PDF",
    });
  }
};
