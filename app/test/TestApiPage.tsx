'use client';



export default function TestApiPage() {
  const callApi = async () => {
    try {
      const response = await fetch('/api/mentor/upsert/e8bb6b8a-a2cb-434f-afb6-fda6aa83bb84', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "Senior Software Engineer",
          company: "Tech Corp",
          years_of_experience: 8,
          years_of_experience_recorded_date: "2025-04-07T00:00:00Z",
          introduction: "Experienced software engineer specializing in web development",
          industries: ["Technology", "E-commerce", "Finance"],
          services: {
            consultation: 100,
            resume_review: 50,
            mock_interview: 150,
            career_guidance: 80
          }
        })
      });
      
      const data = await response.json();
      const resultDiv = document.getElementById('result');
      if (resultDiv) {
        resultDiv.textContent = JSON.stringify(data, null, 2);
      }
    } catch (error) {
      console.error('Error:', error);
      const resultDiv = document.getElementById('result');
      if (resultDiv) {
        resultDiv.textContent = 'Error: ' + (error instanceof Error ? error.message : String(error));
      }
    }
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>Test Mentor API</h1>
        <p> this is a testing page that calling API from local</p>

      <button
        onClick={callApi}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#1890ff',
          border: 'none',
          borderRadius: '4px',
          marginBottom: '20px'
        }}
      >
        Create Mentor
      </button>
      <div
        id="result"
        style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#f5f5f5',
          whiteSpace: 'pre-wrap'
        }}
      >
        Results will appear here...
      </div>
    </div>
  );
} 