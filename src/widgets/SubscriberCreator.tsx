import React, { useState } from 'react';

type SubscriberCreatorProps = {
  onCreate: (topics: string[]) => void
};

export function SubscriberCreator({ onCreate }: SubscriberCreatorProps) {
  const [text, setText] = useState<string>('');
  const [topics, setTopics] = useState<ReadonlyArray<string>>([]);

  function handleChange(newText: string) {
    setText(newText);
    const parsedTopics = newText.split(',').map(topicId => topicId.trim()).filter(topicId => topicId);
    const uniqueTopics = Array.from(new Set(parsedTopics)).sort();
    setTopics(uniqueTopics);
  }

  function handleClick() {
    onCreate([...topics]);
    setText('');
    setTopics([]);
  }

  return (
        <fieldset>
            <legend>Create a subscriber</legend>
            <label htmlFor="topics">Topics:</label>
            <input id="topics" type="text" value={text} onChange={event => handleChange(event.target.value)}/>
            <pre>{JSON.stringify(topics)}</pre>
            <input type="submit" value="Create" disabled={!topics.length} onClick={handleClick}/>
        </fieldset>
  );
}

export default SubscriberCreator;
