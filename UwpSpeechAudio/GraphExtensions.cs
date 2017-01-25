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
    // We are initializing a COM interface for use within the namespace
    // This interface allows access to memory at the byte level which we need to populate audio data that is generated
    [ComImport]
    [Guid("5B0D3235-4DBA-4D44-865E-8F1D0E4FD04D")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    unsafe interface IMemoryBufferByteAccess
    {
        void GetBuffer(out byte* buffer, out uint capacity);
    }

    public class AudioSpeechInputNode : IAudioInputNode
    {
        // File header byte count
        private const int StreamHeaderByteCount = 44;

        // Speech synthesis seems to create a 11.025khz, 32bit pcm output, not sure if this is constant or not
        private static readonly AudioEncodingProperties SpeechEncodingProperties = AudioEncodingProperties.CreatePcm(11025, 1, sizeof(float) * 8);
        
        private Stream _stream;
        private AudioFrameInputNode _frameInputNode;

        public event TypedEventHandler<AudioSpeechInputNode, Object> SpeechCompleted;

        public AudioSpeechInputNode(SpeechSynthesisStream stream, AudioGraph graph)
        {
            _stream = stream.AsStreamForRead();
            _stream.Seek(StreamHeaderByteCount, SeekOrigin.Begin);

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
            _stream.Seek(StreamHeaderByteCount, SeekOrigin.Begin);

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

    public class AudioWhiteNoiseInputNode : IAudioInputNode
    {
        private static readonly Random Random = new Random(DateTimeOffset.Now.Millisecond);
        private static readonly AudioEncodingProperties WhiteNoiseEncodingProperties = AudioEncodingProperties.CreatePcm(11025, 1, sizeof(float) * 8);

        private AudioFrameInputNode _frameInputNode;

        public AudioWhiteNoiseInputNode(AudioGraph graph)
        {
            _frameInputNode = graph.CreateFrameInputNode(WhiteNoiseEncodingProperties);
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
        }

        private unsafe void QuantumStarted(AudioFrameInputNode sender, FrameInputNodeQuantumStartedEventArgs args)
        {
            uint numSamplesNeeded = (uint)args.RequiredSamples;

            if (numSamplesNeeded != 0)
            {
                uint bufferSize = numSamplesNeeded * sizeof(float);
                AudioFrame frame = new AudioFrame(bufferSize);

                using (AudioBuffer buffer = frame.LockBuffer(AudioBufferAccessMode.Write))
                {
                    using (IMemoryBufferReference reference = buffer.CreateReference())
                    {
                        byte* dataInBytes;
                        uint capacityInBytes;
                        float* dataInFloat;

                        // Get the buffer from the AudioFrame
                        ((IMemoryBufferByteAccess)reference).GetBuffer(out dataInBytes, out capacityInBytes);

                        dataInFloat = (float*)dataInBytes;

                        for (int i = 0; i < numSamplesNeeded; i++)
                        {
                            dataInFloat[i] = Convert.ToSingle(Random.NextDouble());
                        }
                    }
                }

                _frameInputNode.AddFrame(frame);
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

    public static class AudioGraphExtensions
    {
        private static async Task<AudioSpeechInputNode> CreateSpeechInputNode(AudioGraph graph, SpeechSynthesizer synth, string text)
        {
            var stream = await synth.SynthesizeTextToStreamAsync(text);

            return new AudioSpeechInputNode(stream, graph);
        }

        public static IAsyncOperation<AudioSpeechInputNode> CreateSpeechInputNodeAsync(this AudioGraph graph, SpeechSynthesizer synth, string text)
        {
            return CreateSpeechInputNode(graph, synth, text).AsAsyncOperation();
        }

        private static Task<AudioWhiteNoiseInputNode> CreateWhiteNoiseInputNode(AudioGraph graph)
        {
            return Task.FromResult(new AudioWhiteNoiseInputNode(graph));
        }

        public static IAsyncOperation<AudioWhiteNoiseInputNode> CreateWhiteNoiseInputNodeAsync(this AudioGraph graph)
        {
            return CreateWhiteNoiseInputNode(graph).AsAsyncOperation();
        }
    }
}
