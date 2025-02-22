import React, { useState, useEffect } from 'react';
import { Tags, TagSystem } from '../../types';

interface TagSelectorProps {
  tags: Tags;
  tagSystem: TagSystem;
  onChange: (newTags: Tags) => void;
  onNewTag: (
    category: 'exam_types' | 'sources' | 'difficulty_levels' | 'question_types',
    value: string
  ) => void;
  onNewHierarchicalTag: (
    examType: string,
    subject: string,
    chapter: string,
    topic: string
  ) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  tags,
  tagSystem,
  onChange,
  onNewTag,
  onNewHierarchicalTag,
}) => {
  // Component-level state
  const [selectedExamType, setSelectedExamType] = useState(tags.exam_type);
  const [selectedSubject, setSelectedSubject] = useState(tags.subject);
  const [selectedChapter, setSelectedChapter] = useState(tags.chapter);
  // Update tags when selections change
  useEffect(() => {
    onChange({
      ...tags,
      exam_type: selectedExamType,
      subject: selectedSubject,
      chapter: selectedChapter,
    });
  }, [selectedExamType, selectedSubject, selectedChapter]);

  const renderSelect = (
    value: string,
    onChange: (value: string) => void,
    options: string[],
    label: string
  ) => {
    return (
      <div className="w-full">
        <select
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue === '') return;
            
            // Handle new tag creation if needed
            if (!options.includes(newValue)) {
              if (label === 'Select exam type') {
                onNewHierarchicalTag(newValue, '', '', '');
              } else if (label === 'Select subject' && selectedExamType) {
                onNewHierarchicalTag(selectedExamType, newValue, '', '');
              } else if (label === 'Select chapter' && selectedSubject) {
                onNewHierarchicalTag(selectedExamType, selectedSubject, newValue, '');
              } else if (label === 'Select topic' && selectedChapter) {
                onNewHierarchicalTag(selectedExamType, selectedSubject, selectedChapter, newValue);
              } else if (label === 'Select source') {
                onNewTag('sources', newValue);
              } else if (label === 'Select difficulty') {
                onNewTag('difficulty_levels', newValue);
              } else if (label === 'Select question type') {
                onNewTag('question_types', newValue);
              }
            }
            onChange(newValue);
          }}
          className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">{label}</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Exam Type</label>
        {renderSelect(
          selectedExamType,
          setSelectedExamType,
          tagSystem.exam_types,
          'Select exam type'
        )}
      </div>

      <div>
        <label className="label">Subject</label>
        {renderSelect(
          selectedSubject,
          setSelectedSubject,
          tagSystem.subjects[selectedExamType] || [],
          'Select subject'
        )}
      </div>

      <div>
        <label className="label">Chapter</label>
        {renderSelect(
          selectedChapter,
          setSelectedChapter,
          tagSystem.chapters[selectedSubject] || [],
          'Select chapter'
        )}
      </div>

      <div>
        <label className="label">Topic</label>
        {renderSelect(
          tags.topic,
          (topic) => onChange({ ...tags, topic }),
          tagSystem.topics[selectedChapter] || [],
          'Select topic'
        )}
      </div>

      <div>
        <label className="label">Difficulty Level</label>
        {renderSelect(
          tags.difficulty_level,
          (level) => onChange({ ...tags, difficulty_level: level as any }),
          tagSystem.difficulty_levels,
          'Select difficulty'
        )}
      </div>

      <div>
        <label className="label">Question Type</label>
        {renderSelect(
          tags.question_type,
          (type) => onChange({ ...tags, question_type: type as any }),
          tagSystem.question_types,
          'Select question type'
        )}
      </div>

      <div>
        <label className="label">Source</label>
        {renderSelect(
          tags.source,
          (source) => onChange({ ...tags, source }),
          tagSystem.sources,
          'Select source'
        )}
      </div>
    </div>
  );
};
