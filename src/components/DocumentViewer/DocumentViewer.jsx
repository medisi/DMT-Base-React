// src/components/DocumentViewer/DocumentViewer.jsx
import React, { useState } from 'react';
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';
import exampleDoc from '../../assets/documents/example_doc.pdf';
import { GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${require('pdfjs-dist/package.json').version}/pdf.worker.js`;

const DocumentViewer = () => {
  const [documents] = useState([
    { uri: exampleDoc, fileType: 'pdf' }
  ]);

  const handleDownload = (uri) => {
    const link = document.createElement('a');
    link.href = uri;
    link.download = uri.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h1>Document Viewer</h1>
      <div>
        <button onClick={() => handleDownload(documents[0].uri)}>Download PDF</button>
      </div>
      <DocViewer documents={documents} pluginRenderers={DocViewerRenderers} />
    </div>
  );
};

export default DocumentViewer;
