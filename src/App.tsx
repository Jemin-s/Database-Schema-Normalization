import React, { useState } from 'react';
import SchemaBuilder from './components/SchemaBuilder';
import FunctionalDependencies from './components/FunctionalDependencies';
import ClosureCalculator from './components/ClosureCalculator';
import CandidateKeyFinder from './components/CandidateKeyFinder';
import Normalization from './components/Normalization';

const App: React.FC = () => {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="header">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-medium">Database Schema Normalization</h1>

        </div>
      </header>

      <main className="main">
        <section>
          <h2 className="text-2xl font-semibold mb-2">Assignment Details</h2>
          <p className="text-lg">
            This is an assignment for the Database Management Systems course. The
            assignment aims to create a simple web application that helps you
            streamline your database design by simplifying closure calculation,
            candidate key identification, and normalization steps.
          </p>
        </section>

        {step === 1 && (
          <div>
            <SchemaBuilder />
            <button 
              onClick={nextStep} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded transition duration-200 ease-in-out hover:bg-blue-600">
              Next: Add Functional Dependencies
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <FunctionalDependencies />
            <div className="flex gap-4 mt-4">
              <button 
                onClick={prevStep} 
                className="px-4 py-2 bg-gray-500 text-white rounded transition duration-200 ease-in-out hover:bg-gray-600">
                Back
              </button>
              <button 
                onClick={nextStep} 
                className="px-4 py-2 bg-blue-500 text-white rounded transition duration-200 ease-in-out hover:bg-blue-600">
                Next: Compute Closures
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <ClosureCalculator />
            <div className="flex gap-4 mt-4">
              <button 
                onClick={prevStep} 
                className="px-4 py-2 bg-gray-500 text-white rounded transition duration-200 ease-in-out hover:bg-gray-600">
                Back
              </button>
              <button 
                onClick={nextStep} 
                className="px-4 py-2 bg-blue-500 text-white rounded transition duration-200 ease-in-out hover:bg-blue-600">
                Next: Find Candidate Keys
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <CandidateKeyFinder />
            <div className="flex gap-4 mt-4">
              <button 
                onClick={prevStep} 
                className="px-4 py-2 bg-gray-500 text-white rounded transition duration-200 ease-in-out hover:bg-gray-600">
                Back
              </button>
              <button 
                onClick={nextStep} 
                className="px-4 py-2 bg-blue-500 text-white rounded transition duration-200 ease-in-out hover:bg-blue-600">
                Next: Normalize Schema
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <Normalization />
            <button 
              onClick={prevStep} 
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded transition duration-200 ease-in-out hover:bg-gray-600">
              Back
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Innovative Assignment - Database Management Systems</p>
        <p>Spring 2025</p>
      </footer>
    </div>
  );
};

export default App;
