import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, Database, AlertCircle } from 'lucide-react';
import { DataSource } from '../types';

export default function DataSources() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    sourceType: 'file',
    files: [] as File[]
  });
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

  // Fetch data sources
  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data-sources');
      if (!response.ok) throw new Error('Failed to fetch data sources');
      const data = await response.json();
      setDataSources(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadForm({
        ...uploadForm,
        files: Array.from(e.target.files)
      });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.name.trim()) {
      setError('Please provide a source name');
      return;
    }

    if (uploadForm.files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('name', uploadForm.name);
      formData.append('description', uploadForm.description);
      formData.append('sourceType', uploadForm.sourceType);
      
      uploadForm.files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/data-sources/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload files');
      }

      setShowUploadForm(false);
      setUploadForm({
        name: '',
        description: '',
        sourceType: 'file',
        files: []
      });
      setError(null);
      await fetchDataSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;

    try {
      const response = await fetch(`/api/data-sources/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete data source');
      await fetchDataSources();
      setSelectedSource(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/data-sources/${id}`);
      if (!response.ok) throw new Error('Failed to fetch details');
      const data = await response.json();
      setSelectedSource(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading data sources...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Data Sources</h1>
          </div>
          <p className="text-gray-400">Upload and manage knowledge base data sources</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300 flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8">
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            <Upload className="w-5 h-5" />
            Add Data Source
          </button>

          {showUploadForm && (
            <div className="mt-4 bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Upload New Data Source</h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Source Name</label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="e.g., Company Policies, Technical Documentation"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 focus:border-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Describe what this data source contains..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Source Type</label>
                  <select
                    value={uploadForm.sourceType}
                    onChange={(e) => setUploadForm({ ...uploadForm, sourceType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-purple-500 outline-none"
                  >
                    <option value="file">Files</option>
                    <option value="document">Document</option>
                    <option value="spreadsheet">Spreadsheet</option>
                    <option value="archive">Archive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Files</label>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-purple-500 transition cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-gray-300">Click to select files or drag and drop</div>
                      <div className="text-gray-500 text-sm mt-1">
                        {uploadForm.files.length > 0 
                          ? `${uploadForm.files.length} file(s) selected`
                          : 'Supported: PDF, DOCX, TXT, CSV, JSON'}
                      </div>
                    </label>
                  </div>
                  
                  {uploadForm.files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm text-gray-300">Selected Files:</h4>
                      {uploadForm.files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                          <div className="text-sm text-gray-300">{file.name}</div>
                          <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition"
                  >
                    {uploading ? 'Uploading...' : 'Upload Files'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Data Sources List */}
          <div className="col-span-2">
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              {dataSources.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No data sources found. Upload files to get started.
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {dataSources.map((source) => (
                    <div
                      key={source.id}
                      onClick={() => handleViewDetails(source.id)}
                      className="p-4 hover:bg-slate-700/50 transition cursor-pointer border-l-4 border-purple-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{source.name}</h3>
                          <p className="text-gray-400 text-sm mt-1">{source.description}</p>
                          <div className="flex gap-4 mt-3 text-xs text-gray-500">
                            <span>{source.file_count} files</span>
                            <span>{formatFileSize(source.file_size || 0)}</span>
                            <span className={`px-2 py-1 rounded ${
                              source.status === 'uploaded' ? 'bg-green-500/30 text-green-300' :
                              source.status === 'processing' ? 'bg-yellow-500/30 text-yellow-300' :
                              'bg-gray-500/30 text-gray-300'
                            }`}>
                              {source.status}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(source.id);
                          }}
                          className="p-2 hover:bg-red-500/20 rounded transition text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="col-span-1">
            <div className="bg-slate-800 rounded-lg p-6 sticky top-8">
              {selectedSource ? (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">{selectedSource.name}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Type</div>
                      <div className="text-white">{selectedSource.source_type}</div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Status</div>
                      <div className={`inline-block px-2 py-1 rounded text-sm ${
                        selectedSource.status === 'uploaded' ? 'bg-green-500/30 text-green-300' :
                        selectedSource.status === 'processing' ? 'bg-yellow-500/30 text-yellow-300' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {selectedSource.status}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Files</div>
                      <div className="text-white">{selectedSource.file_count}</div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Total Size</div>
                      <div className="text-white">{formatFileSize(selectedSource.file_size || 0)}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Files</div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedSource.files?.map((file) => (
                          <div key={file.id} className="text-xs p-2 bg-slate-700 rounded">
                            <div className="text-gray-300 truncate">{file.file_name}</div>
                            <div className="text-gray-500">{formatFileSize(file.file_size)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Uploaded</div>
                      <div className="text-white text-sm">
                        {new Date(selectedSource.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a data source to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
