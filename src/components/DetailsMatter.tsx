import React, { useState } from 'react';
import { getSongSuggestions, Song } from '../services/details-matter.service';

const DetailsMatter: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await getSongSuggestions(prompt);
      setSongs(response.songs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get song suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Details Matter</h1>
      
      {/* Wedding Songs Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Wedding Songs</h2>
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">
              Describe your wedding style and preferences
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="e.g., I want romantic songs for my beach wedding at sunset"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !prompt}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Getting Suggestions...' : 'Get Song Suggestions'}
          </button>
        </form>

        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        {songs.length > 0 && (
          <div className="grid gap-4">
            {songs.map((song, index) => (
              <div key={index} className="border p-4 rounded-md">
                <h3 className="text-xl font-semibold">{song.name}</h3>
                <p className="text-gray-600">{song.artist}</p>
                <p className="mt-2">{song.explanation}</p>
                {song.youtubeLink && (
                  <a
                    href={song.youtubeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline mt-2 inline-block"
                  >
                    Listen on YouTube
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Wedding Details & Recommendations Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Wedding Details & Recommendations</h2>
        <div className="prose max-w-none">
          <p>
            Your wedding day is a celebration of your unique love story. Every detail, from the flowers
            to the music, helps create the perfect atmosphere for your special day. Here are some
            recommendations to help you plan the perfect wedding:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li>Choose a color scheme that reflects your personality</li>
            <li>Select music that resonates with your journey together</li>
            <li>Consider seasonal elements for your decorations</li>
            <li>Plan your timeline carefully to ensure a smooth flow</li>
            <li>Don't forget to capture all the special moments</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DetailsMatter; 