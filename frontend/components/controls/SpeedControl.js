import React from 'react';

const SpeedControl = ({ value, onChange }) => {
  // Convert slider value (100-5000ms) to a logarithmic scale for better usability
  // This makes the slider more sensitive at lower values
  const minSpeed = 100;
  const maxSpeed = 5000;
  const minLog = Math.log(minSpeed);
  const maxLog = Math.log(maxSpeed);
  
  // Convert current value to slider position (0-100)
  const sliderPosition = ((Math.log(value) - minLog) / (maxLog - minLog)) * 100;
  
  // Convert slider position to speed value
  const handleChange = (e) => {
    const position = parseInt(e.target.value);
    const speed = Math.round(Math.exp(minLog + (position / 100) * (maxLog - minLog)));
    onChange(speed);
  };
  
  return (
    <input
      type="range"
      min="0"
      max="100"
      step="1"
      value={sliderPosition}
      onChange={handleChange}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
    />
  );
};

export default SpeedControl;