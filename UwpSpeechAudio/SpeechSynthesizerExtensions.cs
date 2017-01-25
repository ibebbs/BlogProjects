using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Media;
using Windows.Media.Audio;
using Windows.Media.Effects;
using Windows.Media.MediaProperties;
using Windows.Media.SpeechSynthesis;

namespace UwpSpeechAudio
{
    public interface ISpeechSynthesizerAudioNode : IAudioInputNode
    {
        event TypedEventHandler<ISpeechSynthesizerAudioNode, Object> SpeechCompleted;
    }

    internal class SpeechSynthesizerAudioNode : ISpeechSynthesizerAudioNode
    {
        // Speech synthesis seems to create a 11.025khz, 32bit pcm output, not sure if this is constant or not
        private static readonly AudioEncodingProperties SpeechEncodingProperties = AudioEncodingProperties.CreatePcm(11025, 1, sizeof(float) * 8);
        
        private Stream _stream;
        private AudioFrameInputNode _frameInputNode;

        public event TypedEventHandler<ISpeechSynthesizerAudioNode, Object> SpeechCompleted;

        public SpeechSynthesizerAudioNode(SpeechSynthesisStream stream, AudioGraph graph)
        {
            _stream = stream.AsStreamForRead();

            _frameInputNode = graph.CreateFrameInputNode(SpeechEncodingProperties);
            _frameInputNode.QuantumStarted += QuantumStarted;
        }

        public void Dispose()
        {
            if (_frameInputNode != null)
            {
                _frameInputNode.QuantumStarted -= QuantumStarted;
                _frameInputNode.Dispose();
                _frameInputNode = null;
            }

            if (_stream != null)
            {
                _stream.Dispose();
                _stream = null;
            }
        }

        private unsafe void QuantumStarted(AudioFrameInputNode sender, FrameInputNodeQuantumStartedEventArgs args)
        {
            uint numSamplesNeeded = (uint)args.RequiredSamples;

            if (numSamplesNeeded != 0 && _stream.Position < _stream.Length)
            {
                uint bufferSize = numSamplesNeeded * sizeof(float);
                AudioFrame frame = new AudioFrame(bufferSize);

                using (AudioBuffer buffer = frame.LockBuffer(AudioBufferAccessMode.Write))
                {
                    using (IMemoryBufferReference reference = buffer.CreateReference())
                    {
                        byte* dataInBytes;
                        uint capacityInBytes;

                        // Get the buffer from the AudioFrame
                        ((IMemoryBufferByteAccess)reference).GetBuffer(out dataInBytes, out capacityInBytes);

                        for (int i = 0; i < bufferSize; i++)
                        {
                            if (_stream.Position < _stream.Length)
                            {
                                dataInBytes[i] = (byte)_stream.ReadByte();
                            }
                            else
                            {
                                dataInBytes[i] = 0;
                            }
                        }
                    }
                }

                _frameInputNode.AddFrame(frame);
            }
            else
            {
                SpeechCompleted?.Invoke(this, null);
            }
        }

        public void AddOutgoingConnection(IAudioNode destination)
        {
            _frameInputNode.AddOutgoingConnection(destination);
        }

        public void AddOutgoingConnection(IAudioNode destination, double gain)
        {
            _frameInputNode.AddOutgoingConnection(destination, gain);
        }

        public void RemoveOutgoingConnection(IAudioNode destination)
        {
            _frameInputNode.RemoveOutgoingConnection(destination);
        }

        public void Start()
        {
            _frameInputNode.Start();
        }

        public void Stop()
        {
            _frameInputNode.Stop();
        }

        public void Reset()
        {
            _stream.Seek(0, SeekOrigin.Begin);

            _frameInputNode.Reset();
        }

        public void DisableEffectsByDefinition(IAudioEffectDefinition definition)
        {
            _frameInputNode.DisableEffectsByDefinition(definition);
        }

        public void EnableEffectsByDefinition(IAudioEffectDefinition definition)
        {
            _frameInputNode.EnableEffectsByDefinition(definition);
        }

        public IReadOnlyList<AudioGraphConnection> OutgoingConnections
        {
            get { return _frameInputNode.OutgoingConnections; }
        }

        public bool ConsumeInput
        {
            get { return _frameInputNode.ConsumeInput; }
            set { _frameInputNode.ConsumeInput = value; }
        }

        public IList<IAudioEffectDefinition> EffectDefinitions
        {
            get { return _frameInputNode.EffectDefinitions; }
        }

        public AudioEncodingProperties EncodingProperties
        {
            get { return _frameInputNode.EncodingProperties; }
        }

        public double OutgoingGain
        {
            get { return _frameInputNode.OutgoingGain; }
            set { _frameInputNode.OutgoingGain = value; }
        }
    }

    public static class SpeechSynthesizerExtensions
    {
        public static async Task<ISpeechSynthesizerAudioNode> SynthesizeTextToAudioNodeAsync(this SpeechSynthesizer synth, string text, AudioGraph graph)
        {
            var stream = await synth.SynthesizeTextToStreamAsync(text);

            return new SpeechSynthesizerAudioNode(stream, graph);
        }
    }
}
