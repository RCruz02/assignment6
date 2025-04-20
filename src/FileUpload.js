import React, { Component } from 'react';
import * as d3 from 'd3';

class FileUpload extends Component {
  state = { file: null };

  handleFileSubmit = (e) => {
    e.preventDefault(); // Prevent form from actually submitting
    if (this.state.file) { // Check if a file has been uploaded
      const reader = new FileReader(); // Create a new FileReader object
      reader.onload = (e) => { // Define the onload event handler
        const csvText = e.target.result; // Get the CSV text from the file
        const blob = new Blob([csvText], { type: 'text/csv' }); // Create a Blob from the CSV text
        const url = URL.createObjectURL(blob); // Create a URL for the Blob

        d3.csv(url).then((data) => {
          const parsedData = data.map(row => {
            const formatted = {};
            for (let key in row) {
              const lowerKey = key.toLowerCase();
              if (lowerKey === "date") {
                formatted[key] = row[key]; // keep date as string
              } else {
                formatted[key] = isNaN(+row[key]) ? 0 : +row[key]; // safely cast numeric
              }
            }
            return formatted;
          });
          this.props.set_data(parsedData); // Pass the parsed data to the parent component
          URL.revokeObjectURL(url); // Release the Blob URL to prevent memory leaks
        }).catch(console.error); // Handle any errors during CSV parsing
      };
      reader.readAsText(this.state.file); // Read the selected file as text
    }
  };

  render = () => (
    <div style={{ backgroundColor: "#f0f0f0", padding: 20 }}>
      <h2>Upload a CSV File</h2>
      <form onSubmit={this.handleFileSubmit}>
        <input type="file" accept=".csv" onChange={(e) => this.setState({ file: e.target.files[0] })} />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}

export default FileUpload;