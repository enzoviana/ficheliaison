const axios = require('axios');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());
// Define a GET endpoint that internally makes a POST request
app.get('/get-data', async (req, res) => {
  try {
    const postResponse = await axios.post('https://lean-dev.planett.net/planete-online-server/messagerie/recuperation-fiches-dashboard', {});
    const responseData = postResponse.data.slice(0, 4); // Limit the result to the first 10 items
    res.json(responseData);
  } catch (error) {
    res.status(error.response.status || 500).json({ error: error.message });
  }
});


app.get('/fiche-liaison', async (req, res) => {
    try {
        const postResponse = await axios.post('https://lean-dev.planett.net/planete-online-server/messagerie/recuperation-fiches-dashboard', {});

        let extractedData = postResponse.data.map(entry => ({
          _id: entry._id,
          message: entry.fiche.objet,
          client: entry.fiche.client,
          etat: entry.fiche.etat.text.split('.').pop(),
          nom: entry.fiche.userCreate?.lastname || null,
          prenom: entry.fiche.userCreate?.firstname,
          module: entry.fiche.module.name,
          date: formatDate(entry.createdAt),
          type_demande: entry.fiche.type_demande?.text?.split('.').pop() || null,
        }));
        
      // Count by module
      const moduleCounts = {};
      extractedData.forEach(entry => {
        const moduleName = entry.module;
        if (moduleName) {
          moduleCounts[moduleName] = (moduleCounts[moduleName] || 0) + 1;
        }
      });
      
      // Filter by client
    const clientFilter = req.query.client; // Get the client query parameter
    if (clientFilter) {
      extractedData = extractedData.filter(entry => entry.client === clientFilter);
    }

    // Filter by module
    const moduleFilter = req.query.module;
    if (moduleFilter) {
      extractedData = extractedData.filter(entry => entry.module === moduleFilter);
    }

      // Filter by date range
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
  
      if (startDate && endDate) {
        const startDateTime = new Date(startDate).getTime();
        const endDateTime = new Date(endDate).getTime();
        extractedData = extractedData.filter(entry => {
          const entryDate = new Date(entry.date).getTime();
          return entryDate >= startDateTime && entryDate <= endDateTime;
        });
      } else if (startDate) {
        const startDateTime = new Date(startDate).getTime();
        extractedData = extractedData.filter(entry => {
          const entryDate = new Date(entry.date).getTime();
          return entryDate >= startDateTime;
        });
      } else if (endDate) {
        const endDateTime = new Date(endDate).getTime();
        extractedData = extractedData.filter(entry => {
          const entryDate = new Date(entry.date).getTime();
          return entryDate <= endDateTime;
        });
      }
  
      // Recalculate moduleCounts for the filtered data
      const filteredModuleCounts = {};
      extractedData.forEach(entry => {
        const moduleName = entry.module;
        if (moduleName) {
          filteredModuleCounts[moduleName] = (filteredModuleCounts[moduleName] || 0) + 1;
        }
      });
  
      // Update moduleCounts with the filtered counts
      Object.keys(moduleCounts).forEach(moduleName => {
        moduleCounts[moduleName] = filteredModuleCounts[moduleName] || 0;
      });
  
      const responseData = {
        extractedData: extractedData,
        moduleCounts: moduleCounts,
      };
  
      res.json(responseData);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().substr(0, 10); // Extract YYYY-MM-DD
  }
  
  
  
  
  
  


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
